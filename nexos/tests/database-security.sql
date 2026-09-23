-- Runs against the deployed schema; all fixture writes are rolled back.
begin;
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('orders','idempotency_keys','customer_bindings','webhook_events') and not c.relrowsecurity) then
    raise exception 'RLS disabled';
  end if;
  if has_table_privilege('authenticated','public.webhook_events','INSERT')
     or has_table_privilege('authenticated','public.customer_bindings','INSERT')
     or has_table_privilege('anon','public.orders','SELECT')
     or has_function_privilege('anon','public.apply_checkout_event(text,text,text,text,text,bigint)','EXECUTE') then
    raise exception 'Privileged resources exposed';
  end if;
end $$;
set local role service_role;
do $$ begin
  if not public.consume_auth_attempt('security-test-rate-key',2,60) then raise exception 'First attempt denied'; end if;
  if not public.consume_auth_attempt('security-test-rate-key',2,60) then raise exception 'Second attempt denied'; end if;
  if public.consume_auth_attempt('security-test-rate-key',2,60) then raise exception 'Rate limit bypass'; end if;
end $$;
insert into public.orders (amount_cents,product_id,quantity,external_reference,payment_id)
values (1000,'security-test',1,'nexos-security-transaction-test','payment-security-test');
select public.apply_checkout_event('event-security-1','PAYMENT_RECEIVED','payment-security-test','nexos-security-transaction-test','paid',1000);
select public.apply_checkout_event('event-security-1','PAYMENT_RECEIVED','payment-security-test','nexos-security-transaction-test','paid',1000);
select public.apply_checkout_event('event-security-2','PAYMENT_UPDATED','payment-security-test','nexos-security-transaction-test','processing',1000);
do $$
begin
  if (select status from public.orders where external_reference='nexos-security-transaction-test') <> 'paid' then raise exception 'Status regressed'; end if;
  if (select count(*) from public.webhook_events where event_id='event-security-1') <> 1 then raise exception 'Duplicate event'; end if;
  begin
    perform public.apply_checkout_event('event-security-bad','PAYMENT_RECEIVED','payment-security-test','nexos-security-transaction-test','paid',1);
    raise exception 'Mismatch accepted' using errcode='P0002';
  exception when raise_exception then null;
  end;
  if exists (select 1 from public.webhook_events where event_id='event-security-bad') then raise exception 'Failed event was committed'; end if;
end $$;
select public.apply_checkout_event('event-security-3','PAYMENT_REFUNDED','payment-security-test','nexos-security-transaction-test','refunded',1000);
do $$ begin
  if (select status from public.orders where external_reference='nexos-security-transaction-test') <> 'refunded' then raise exception 'Refund not applied'; end if;
end $$;
set local role authenticated;
do $$ begin
  if exists (select 1 from public.orders where external_reference='nexos-security-transaction-test') then raise exception 'Guest order exposed'; end if;
end $$;
reset role;
rollback;
select 'PASS: RLS, grants, deduplication, rollback, monotonic status and refunds' as result;
