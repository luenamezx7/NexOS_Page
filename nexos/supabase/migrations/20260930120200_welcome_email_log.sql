-- NexOS — registro de e-mails de boas-vindas
-- Versão: 1.0
-- Data: 2026-09-30
-- Depende de: 20260930120000_better_auth.sql
--
-- O bookkeeping vivia em auth.users.app_metadata, que não existe no Better Auth.
-- Uma tabela própria é preferível a uma coluna extra em public."user": o schema
-- do Better Auth é dele, e o registro é concern do app, não da autenticação.
--
-- A chave é o par (user_id, template): a chave única é o que torna o envio
-- idempotente sob concorrência, já que dois requests podem confirmar o e-mail ao
-- mesmo tempo.

begin;

create table if not exists public.welcome_email_log (
  user_id uuid not null references public."user"(id) on delete cascade,
  template text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, template)
);

alter table public.welcome_email_log enable row level security;
revoke all on public.welcome_email_log from anon, authenticated;

commit;
