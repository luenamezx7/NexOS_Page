begin;
create table public.auth_rate_limits (
  key_hash text primary key,
  attempts integer not null default 1 check (attempts > 0),
  expires_at timestamptz not null
);
create index auth_rate_limits_expiry_idx on public.auth_rate_limits(expires_at);
alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from public, anon, authenticated;
grant all on public.auth_rate_limits to service_role;

create function public.consume_auth_attempt(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 3600 then raise exception 'Invalid limit'; end if;
  delete from public.auth_rate_limits where expires_at < now();
  insert into public.auth_rate_limits(key_hash,expires_at)
    values(p_key, now() + make_interval(secs => p_window_seconds))
    on conflict (key_hash) do update set attempts = public.auth_rate_limits.attempts + 1
    returning attempts into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_auth_attempt(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_auth_attempt(text,integer,integer) to service_role;
commit;
