-- NexOS — Schema inicial
-- Versão: 1.0
-- Data: 2026-09-23
-- Observação: Migração versionada para Supabase com RLS

begin;

-- ── Pedidos ──────────────────────────────────────

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents >= 500),
  currency text not null default 'brl',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'cancelled', 'refunded', 'unknown')),
  product_id text not null,
  quantity int not null check (quantity >= 1),
  billing_type text not null default 'UNDEFINED'
    check (billing_type in ('PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED')),
  external_reference text unique,
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;

create policy orders_read_own
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Sem policy de escrita para clientes: intencional.
-- A escrita confiável é implementada via service_role com autorização.

create index orders_owner_id_idx on public.orders(owner_id);
create index orders_external_reference_idx on public.orders(external_reference);
create index orders_status_idx on public.orders(status);

-- ── Tentativas idempotentes ──────────────────────

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  key_hash text not null,
  payload_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'unknown')),
  result jsonb,
  provider_reference text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique (owner_id, key_hash)
);

alter table public.idempotency_keys enable row level security;
revoke all on public.idempotency_keys from anon, authenticated;
grant all on public.idempotency_keys to service_role;

create policy idempotency_read_own
  on public.idempotency_keys for select
  to authenticated
  using ((select auth.uid()) = owner_id);


create index idempotency_key_hash_idx on public.idempotency_keys(key_hash);
create index idempotency_owner_id_idx on public.idempotency_keys(owner_id);

-- ── Vinculos de cliente ──────────────────────────

create table if not exists public.customer_bindings (
  id uuid primary key default gen_random_uuid(),
  application_user_id uuid not null references auth.users(id),
  provider_customer_id text not null,
  provider text not null default 'asaas',
  created_at timestamptz not null default now(),
  unique (application_user_id, provider_customer_id, provider)
);

alter table public.customer_bindings enable row level security;
revoke all on public.customer_bindings from anon, authenticated;
grant all on public.customer_bindings to service_role;

create policy customer_bindings_read_own
  on public.customer_bindings for select
  to authenticated
  using ((select auth.uid()) = application_user_id);


create index customer_bindings_user_id_idx on public.customer_bindings(application_user_id);

-- ── Eventos de webhook ───────────────────────────

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  provider text not null default 'asaas',
  event_id text unique,
  payload jsonb not null,
  status text not null default 'received'
    check (status in ('received', 'processing', 'processed', 'failed')),
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
revoke all on public.webhook_events from anon, authenticated;
grant all on public.webhook_events to service_role;

create index webhook_events_event_id_idx on public.webhook_events(event_id);
create index webhook_events_status_idx on public.webhook_events(status);
create index webhook_events_created_at_idx on public.webhook_events(created_at);

-- ── Grants ───────────────────────────────────────

-- Nenhum grant adicional necessário além dos policies acima.
-- service_role não é usado para leitura de tabelas cliente.

commit;
