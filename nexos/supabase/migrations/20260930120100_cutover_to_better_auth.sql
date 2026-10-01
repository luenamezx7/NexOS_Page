-- NexOS — Cutover do Supabase Auth para o Better Auth
-- Versão: 1.0
-- Data: 2026-09-30
-- Depende de: 20260930120000_better_auth.sql
--
-- O QUE ESTA MIGRAÇÃO FAZ
-- 1. Copia as contas de auth.users para public."user" preservando o id.
-- 2. Reponto as FKs das tabelas de cliente para public."user".
-- 3. Remove as policies de RLS baseadas em auth.uid().
-- 4. Move os triggers de auth.users para public."user".
--
-- ─────────────────────────────────────────────────────────────────────────
-- DECISÃO DE ARQUITETURA QUE ESTA MIGRAÇÃO TORNA DEFINITIVA
--
-- O isolamento de linhas deixa de ser feita pelo Postgres.
--
-- Antes: as queries usavam o JWT do Supabase Auth e o RLS aplicava
-- `auth.uid() = owner_id` no próprio banco. O banco era a autoridade.
--
-- Agora: o Better Auth não emite JWT do Supabase, então `auth.uid()` é sempre
-- nulo e essas policies nunca casariam — permaneceriam como segurança de
-- fachada, sugerindo uma garantia que não existe. Por isso são removidas.
--
-- A autoridade passa a ser o backend, em src/lib/db/user-scope.ts, que valida
-- a sessão Better Auth e aplica o filtro de dono na consulta. O RLS permanece
-- LIGADO e sem policies (default-deny): se algum dia alguém GRANTar acesso a
-- anon/authenticated, o banco ainda nega. Revogar o acesso do cliente é
-- necessário para o default-deny valer.
-- ─────────────────────────────────────────────────────────────────────────
--
-- ⚠️ ESTA MIGRAÇÃO É IRREVERSÍVEL PARA auth.users
--    Rode o backup antes. Ela foi escrita para ser idempotente e segura em
--    reexecução, mas apaga as policies — que não têm como ser recriadas igual.

begin;

-- ── 1. Contas: auth.users → public."user" ───────────────────────────────
-- O id é preservado de propósito: é ele que liga orders, profiles, addresses
-- e customer_bindings. Trocar o id exigiria reescrever todas essas chaves
-- estrangeiras e arriscaria perder a associação de pedidos já feitos.
insert into public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  lower(u.email),
  (u.email_confirmed_at is not null),
  u.raw_user_meta_data->>'avatar_url',
  u.created_at,
  coalesce(u.updated_at, u.created_at)
from auth.users u
on conflict (id) do update
set email        = excluded.email,
    name         = excluded.name,
    "emailVerified" = excluded."emailVerified",
    "updatedAt"  = now();

-- Um mesmo e-mail em duas contas do Supabase Auth violaria o índice único.
-- Sem esta detecção a migração abortaria no meio, com estado parcial.
do $$
begin
  if exists (
    select 1 from public."user" group by lower(email) having count(*) > 1
  ) then
    raise exception 'Better Auth: e-mails duplicados em public."user" — resolva antes de prosseguir';
  end if;
end $$;

-- ── 2. FKs: auth.users → public."user" ─────────────────────────────────
-- As policies do passo 3 são removidas ANTES das FKs porque uma policy que
-- referencia auth.uid() continuaria válida até o fim da transação.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id)
  references public."user"(id) on delete cascade;

alter table public.addresses
  drop constraint if exists addresses_user_id_fkey;
alter table public.addresses
  add constraint addresses_user_id_fkey foreign key (user_id)
  references public."user"(id) on delete cascade;

alter table public.orders
  drop constraint if exists orders_owner_id_fkey;
alter table public.orders
  add constraint orders_owner_id_fkey foreign key (owner_id)
  references public."user"(id) on delete cascade;

alter table public.customer_bindings
  drop constraint if exists customer_bindings_application_user_id_fkey;
alter table public.customer_bindings
  add constraint customer_bindings_application_user_id_fkey foreign key (application_user_id)
  references public."user"(id) on delete cascade;

alter table public.idempotency_keys
  drop constraint if exists idempotency_keys_owner_id_fkey;
alter table public.idempotency_keys
  add constraint idempotency_keys_owner_id_fkey foreign key (owner_id)
  references public."user"(id) on delete cascade;

alter table public.account_email_index
  drop constraint if exists account_email_index_user_id_fkey;
alter table public.account_email_index
  add constraint account_email_index_user_id_fkey foreign key (user_id)
  references public."user"(id) on delete cascade;

-- ── 3. Policies baseadas em auth.uid() ────────────────────────────────
-- auth.uid() pertence ao schema auth e depende do JWT do Supabase Auth, que a
-- NexOS deixou de emitir. Estas policies passariam a negar tudo se algum dia
-- fossem exercidas, e anilariam o sinal de segurança do RLS.
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_insert_own"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;

drop policy if exists "addresses_select_own"  on public.addresses;
drop policy if exists "addresses_insert_own"  on public.addresses;
drop policy if exists "addresses_update_own"  on public.addresses;
drop policy if exists "addresses_delete_own"  on public.addresses;

drop policy if exists orders_read_own         on public.orders;
drop policy if exists orders_require_mfa      on public.orders;
drop policy if exists idempotency_read_own    on public.idempotency_keys;
drop policy if exists idempotency_write_own   on public.idempotency_keys;
drop policy if exists customer_bindings_read_own  on public.customer_bindings;
drop policy if exists customer_bindings_write_own on public.customer_bindings;
drop policy if exists webhook_events_read_own    on public.webhook_events;
drop policy if exists webhook_events_insert       on public.webhook_events;

-- Sem policies e com RLS ligado, o default-deny precisa valer de verdade: as
-- tabelas não podem continuar acessível por anon/authenticated.
revoke all on public.profiles            from anon, authenticated;
revoke all on public.addresses           from anon, authenticated;
revoke all on public.orders              from anon, authenticated;
revoke all on public.customer_bindings   from anon, authenticated;
revoke all on public.idempotency_keys    from anon, authenticated;
revoke all on public.account_email_index from anon, authenticated;

-- ── 4. Triggers: auth.users → public."user" ────────────────────────────
-- handle_new_user(): cria o perfil junto com a conta. Referenciava
-- raw_user_meta_data, que é conceito do Supabase Auth e não existe em
-- public."user" — o nome agora vem da própria linha inserida.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.name, ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_user_created on public."user";
create trigger on_user_created
  after insert on public."user"
  for each row execute function public.handle_new_user();

-- Backfill: contas migradas no passo 1 não passaram pelo trigger acima.
insert into public.profiles (id, full_name)
select u.id, coalesce(nullif(u.name, ''), split_part(u.email, '@', 1))
from public."user" u
on conflict (id) do nothing;

-- sync_account_email_index(): mesma mudança de destino para o trigger.
-- Reimplementada contra public."user" (a versão antiga lia auth.users).
create or replace function public.sync_account_email_index()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    insert into public.account_email_index (user_id, email, confirmed)
    values (new.id, lower(new.email), new."emailVerified")
    on conflict (user_id) do update
      set email = excluded.email,
          confirmed = excluded.confirmed;
  elsif tg_op = 'DELETE' then
    delete from public.account_email_index where user_id = old.id;
  end if;
  return null;
end;
$$;

drop trigger if exists account_email_index_sync on auth.users;
drop trigger if exists account_email_index_sync on public."user";
create trigger account_email_index_sync
  after insert or update or delete on public."user"
  for each row execute function public.sync_account_email_index();

-- Backfill do índice de e-mail para as contas já copiadas.
insert into public.account_email_index (user_id, email, confirmed)
select id, lower(email), "emailVerified" from public."user"
on conflict (user_id) do update
  set email = excluded.email,
      confirmed = excluded.confirmed;

-- ── 5. Limpeza ────────────────────────────────────────────────────────
-- Impede que o Supabase Auth continue aceitando login de produção por um caminho
-- que ninguém está mais monitorando: sessões futuras cairiam em auth.users sem
-- passar por este cutover.
-- (mantido comentado de propósito: depende de decisão operacional sobre
--  se ainda há logins legítimos chegando pelo GoTrue)
--
-- delete from auth.sessions;
-- update auth.users set banned = true where email not in (select email from public."user");

commit;
