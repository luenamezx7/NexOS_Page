import 'server-only';

import { createHash } from 'node:crypto';
import type { createAdminClient } from './supabase/admin';
import { issueStatusToken } from './status-token';
import { parseCheckoutPayment, type CheckoutOrderSnapshot } from './checkout';

/** Both lookups include the authenticated owner; references alone never authorize access. */
export async function loadCheckoutOrder(db: ReturnType<typeof createAdminClient>, ownerId: string, lookup: { key?: string; externalReference?: string; paymentId?: string }): Promise<CheckoutOrderSnapshot | null> {
  if (!ownerId) throw new Error('Authentication required');
  let reference = lookup.externalReference;
  let attempt: { status: string; result: unknown; provider_reference: string | null } | null = null;
  if (lookup.key) {
    const keyHash = createHash('sha256').update(lookup.key).digest('hex');
    const result = await db.from('idempotency_keys').select('status,result,provider_reference').eq('key_hash', keyHash).eq('owner_id', ownerId).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    attempt = result.data;
    reference = attempt!.provider_reference ?? undefined;
  }
  if (!reference && !lookup.paymentId) return { status: attempt?.status ?? 'unknown', order: null, payment: null, credentials: null };
  let query = db.from('orders').select('product_id,quantity,amount_cents,status,external_reference').eq('owner_id', ownerId);
  query = reference ? query.eq('external_reference', reference) : query.eq('payment_id', lookup.paymentId!);
  const found = await query.maybeSingle();
  if (found.error) throw found.error;
  if (!found.data) return lookup.key ? { status: attempt?.status ?? 'unknown', order: null, payment: null, credentials: null } : null;
  reference = found.data.external_reference;
  if (!attempt) {
    const result = await db.from('idempotency_keys').select('status,result,provider_reference').eq('provider_reference', reference).eq('owner_id', ownerId).maybeSingle();
    if (result.error) throw result.error;
    attempt = result.data;
  }
  const row = found.data;
  const amount = Number(row.amount_cents);
  if (!Number.isSafeInteger(amount) || amount < 500 || !row.external_reference) throw new Error('Invalid order');
  const credentials = { externalReference: row.external_reference, statusToken: issueStatusToken(row.external_reference).token };
  const saved = parseCheckoutPayment(attempt?.result);
  const payment = saved && saved.externalReference === row.external_reference ? { ...saved, ...credentials, amount } : null;
  return { status: attempt?.status ?? 'unknown', order: { productId: row.product_id, quantity: row.quantity, amount, status: row.status, externalReference: row.external_reference }, payment, credentials };
}
