import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentStatus } from '@/lib/asaas';

type WebhookPayment = { id: string; externalReference?: string | null; status: string; value?: number; billingType?: string };

export async function processWebhookEvent(eventId: string, event: string, payment: WebhookPayment): Promise<void> {
  if (!payment.externalReference?.startsWith('nexos-')) return;
  // Reconcile with the provider instead of trusting an out-of-order event status.
  const current = await getPaymentStatus(payment.externalReference, 'externalReference');
  if (!current.paymentIds.includes(payment.id)) throw new Error('Payment reference mismatch');
  const status = current.paid ? 'paid'
    : current.status === 'REFUNDED' ? 'refunded'
    : ['DELETED', 'CANCELLED'].includes(current.status) ? 'cancelled' : 'processing';
  const db = createAdminClient();
  const { data: order, error: orderError } = await db.from('orders').select('payment_id').eq('external_reference', payment.externalReference).single();
  if (orderError || !order?.payment_id || !current.paymentIds.includes(order.payment_id)) throw new Error('Order not ready for reconciliation');
  const { error } = await db.rpc('apply_checkout_event', {
    p_event_id: eventId, p_event_type: event, p_payment_id: order.payment_id,
    p_reference: payment.externalReference, p_status: status,
    p_amount_cents: Math.round((current.value ?? 0) * 100),
  });
  if (error) throw error;
}
