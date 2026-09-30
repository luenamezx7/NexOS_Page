-- Index of Auth e-mails for O(1) duplicate checks during signup.
--
-- The signup handler previously paged through auth.users to look for an address,
-- which is O(n) per attempt and can be forced into a costly scan. This table is
-- maintained by trigger and looked up by its primary key instead.
--
-- Security: RLS is enabled with no client policies, so anon/authenticated cannot
-- read it. Only the service-role client (server-side) can.
create table if not exists public.account_email_index (
  email text primary key check (email = lower(email)),
  user_id uuid not null references auth.users(id) on delete cascade,
  confirmed boolean not null default false
);

comment on table public.account_email_index is
  'Server-only lookup of Auth e-mails used to detect already-registered addresses.';

alter table public.account_email_index enable row level security;

create or replace function public.sync_account_email_index()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.account_email_index where email = old.email;
    return old;
  end if;

  if new.email is null then
    return new;
  end if;

  insert into public.account_email_index (email, user_id, confirmed)
  values (new.email, new.id, new.email_confirmed_at is not null)
  on conflict (email) do update
    set user_id = excluded.user_id,
        confirmed = excluded.confirmed;

  -- A changed address must not leave the previous entry behind.
  if tg_op = 'UPDATE' and old.email is distinct from new.email then
    delete from public.account_email_index where email = old.email;
  end if;

  return new;
end;
$$;

drop trigger if exists account_email_index_sync on auth.users;
create trigger account_email_index_sync
  after insert or update or delete on auth.users
  for each row execute function public.sync_account_email_index();

-- Backfill existing users so the check is correct immediately after deploying.
insert into public.account_email_index (email, user_id, confirmed)
select lower(u.email), u.id, u.email_confirmed_at is not null
from auth.users as u
where u.email is not null
on conflict (email) do update
  set user_id = excluded.user_id,
      confirmed = excluded.confirmed;
