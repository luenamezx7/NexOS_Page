-- Better Auth 1.7.7: WebAuthn e entrega idempotente de notificações.
begin;

-- As sessões anteriores não comprovam o segundo fator dos logins OAuth.
-- Exigir uma nova autenticação nas contas com MFA após o deploy.
delete from public.session s using public."user" u
where s."userId" = u.id and u."twoFactorEnabled" = true;

create table public.passkey (
  id uuid primary key default gen_random_uuid(),
  name text,
  "publicKey" text not null,
  "userId" uuid not null references public."user"(id) on delete cascade,
  "credentialID" text not null unique,
  counter bigint not null check (counter >= 0),
  "deviceType" text not null,
  "backedUp" boolean not null,
  transports text,
  "createdAt" timestamptz default now(),
  aaguid text
);
create index passkey_user_id_idx on public.passkey ("userId");

-- Payloads de notificações não contêm senhas, tokens ou segredos TOTP.
-- Leases permitem recuperar envios interrompidos sem reservar para sempre.
create table public.auth_email_outbox (
  event_key text primary key,
  user_id uuid not null references public."user"(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent')),
  attempts integer not null default 0,
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index auth_email_outbox_pending_idx on public.auth_email_outbox (user_id, next_attempt_at)
  where status <> 'sent';

-- Não reenviar boas-vindas já registradas pelo sistema anterior.
insert into public.auth_email_outbox (event_key, user_id, payload, status, sent_at)
select 'welcome/' || user_id::text, user_id, '{}'::jsonb, 'sent', sent_at
from public.welcome_email_log
on conflict do nothing;

alter table public.passkey enable row level security;
alter table public.auth_email_outbox enable row level security;
revoke all on public.passkey from public, anon, authenticated;
revoke all on public.auth_email_outbox from public, anon, authenticated;

commit;
