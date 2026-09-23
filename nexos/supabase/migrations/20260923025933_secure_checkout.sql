begin;

-- Guests own no Auth row; their random checkout token grants status access only.
alter table public.orders alter column owner_id drop not null;
alter table public.idempotency_keys alter column owner_id drop not null;
create unique index if not exists idempotency_global_key_idx on public.idempotency_keys(key_hash);
create unique index if not exists orders_payment_id_idx on public.orders(payment_id) where payment_id is not null;

-- Provider bindings, replay records and webhook payloads are server-managed.
revoke all on public.idempotency_keys, public.customer_bindings, public.webhook_events from anon, authenticated;
drop policy if exists idempotency_read_own on public.idempotency_keys;
drop policy if exists idempotency_write_own on public.idempotency_keys;
drop policy if exists customer_bindings_read_own on public.customer_bindings;
drop policy if exists customer_bindings_write_own on public.customer_bindings;
drop policy if exists webhook_events_read_own on public.webhook_events;
drop policy if exists webhook_events_insert on public.webhook_events;
grant all on public.orders, public.idempotency_keys, public.customer_bindings, public.webhook_events to service_role;

-- One transaction covers deduplication and order updates. No SECURITY DEFINER.
create or replace function public.apply_checkout_event(
  p_event_id text, p_event_type text, p_payment_id text,
  p_reference text, p_status text, p_amount_cents bigint
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_event public.webhook_events%rowtype;
  v_order public.orders%rowtype;
begin
  if p_status not in ('pending', 'processing', 'paid', 'cancelled', 'refunded', 'unknown') then
    raise exception 'Invalid status';
  end if;
  insert into public.webhook_events(event_id, event_type, payload)
    values (p_event_id, p_event_type, jsonb_build_object('payment_id', p_payment_id))
    on conflict (event_id) do nothing;
  select * into strict v_event from public.webhook_events where event_id = p_event_id for update;
  if v_event.status = 'processed' then return; end if;
  select * into v_order from public.orders where external_reference = p_reference for update;
  if not found then raise exception 'Order not available yet'; end if;
  if v_order.payment_id is distinct from p_payment_id then raise exception 'Payment mismatch'; end if;
  if v_order.amount_cents <> p_amount_cents then raise exception 'Amount mismatch'; end if;
  -- Late pending/paid events cannot reverse an already refunded/cancelled order.
  if v_order.status not in ('cancelled', 'refunded') and
     (v_order.status <> 'paid' or p_status in ('paid', 'refunded', 'cancelled')) then
    update public.orders set status = p_status, updated_at = now() where id = v_order.id;
  end if;
  update public.webhook_events set status = 'processed', processed_at = now() where id = v_event.id;
end;
$$;
revoke all on function public.apply_checkout_event(text,text,text,text,text,bigint) from public, anon, authenticated;
grant execute on function public.apply_checkout_event(text,text,text,text,text,bigint) to service_role;

commit;
