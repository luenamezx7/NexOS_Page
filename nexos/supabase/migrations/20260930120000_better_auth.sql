-- NexOS — Better Auth: identidade, sessões e 2FA
-- Versão: 1.0
-- Data: 2026-09-30
--
-- Observações de arquitetura:
-- - Estas tabelas passam a ser a ÚNICA fonte de identidade e sessão do app.
--   Supabase Auth perde esse papel; o Postgres segue como banco de dados.
-- - IDs são UUID (advanced.database.generateId), preservando compatibilidade com
--   as colunas uuid já existentes em orders/profiles/etc.
-- - Não há FK para auth.users: a migração de usuários e o repontamento das FKs
--   estão em migrations posteriores e são executadas em conjunto.
--
-- RLS permanece ATIVO e sem policies de cliente: estas tabelas nunca são lidas
-- pelo Data API. O acesso é exclusivo do backend via conexão privilegiada, e as
-- policies abaixo protegem contra um grant futuro acidental a anon/authenticated.

begin;

-- ── Usuários ──────────────────────────────────────
create table if not exists public."user" (
  id uuid primary key,
  name text not null,
  email text not null,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null,
  "twoFactorEnabled" boolean default false,
  role text,
  banned boolean default false,
  "banReason" text,
  "banExpires" timestamp
);

create unique index if not exists "user_email_unique" on public."user" (email);

-- ── Sessões ───────────────────────────────────────
-- Sessão persistida no banco: revogação é verificável e imediata. Uma entrada
-- apagada aqui invalida o cookie correspondente na mesma hora.
create table if not exists public.session (
  id uuid primary key,
  "expiresAt" timestamp not null,
  token text not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references public."user"(id) on delete cascade,
  "impersonatedBy" text
);

create unique index if not exists session_token_unique on public.session (token);
create index if not exists session_userId_idx on public.session ("userId");

-- ── Contas (credencial + OAuth) ───────────────────
create table if not exists public.account (
  id uuid primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references public."user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create index if not exists account_userId_idx on public.account ("userId");
-- Impede que o mesmo provedor vincule duas contas ao mesmo perfil externo.
create unique index if not exists account_providerId_accountId_unique on public.account ("providerId", "accountId");

-- ── Verificações (e-mail e recuperação) ───────────
create table if not exists public.verification (
  id uuid primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create index if not exists verification_identifier_idx on public.verification (identifier);

-- ── Segundo fator (TOTP + códigos de backup) ──────
create table if not exists public."twoFactor" (
  id uuid primary key,
  secret text not null,
  "backupCodes" text not null,
  "userId" uuid not null references public."user"(id) on delete cascade,
  verified boolean default true,
  "failedVerificationCount" integer default 0,
  "lockedUntil" timestamp
);

create index if not exists twoFactor_userId_idx on public."twoFactor" ("userId");

-- ── Rate limiting compartilhado ───────────────────
-- Vive no Postgres porque o app roda em serverless: um Map em memória não é
-- compartilhado entre instâncias e permitiria burlar o limite por rebalance.
create table if not exists public."rateLimit" (
  key text primary key,
  count integer not null,
  "lastRequest" bigint not null
);

-- ── Isolamento ────────────────────────────────────
-- RLS ligado e SEM policies de cliente: se alguém conceder acesso a anon ou
-- authenticated, a lack de policy nega tudo (default-deny).
alter table public."user" enable row level security;
alter table public.session enable row level security;
alter table public.account enable row level security;
alter table public.verification enable row level security;
alter table public."twoFactor" enable row level security;
alter table public."rateLimit" enable row level security;

revoke all on public."user" from anon, authenticated;
revoke all on public.session from anon, authenticated;
revoke all on public.account from anon, authenticated;
revoke all on public.verification from anon, authenticated;
revoke all on public."twoFactor" from anon, authenticated;
revoke all on public."rateLimit" from anon, authenticated;

commit;