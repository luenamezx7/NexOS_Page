export interface ProviderPayment {
  id: string;
  status: string;
  value: number;
  originalValue?: number | null;
  billingType: string;
  deleted?: boolean;
}

// An installment response represents just one charge. Confirm the entire order.
export function summarizePayments(payments: ProviderPayment[]) {
  const settled = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
  const paid = payments.length > 0 && payments.every(p => settled.has(p.status) && !p.deleted);
  const refunded = payments.length > 0 && payments.every(p => p.status === 'REFUNDED');
  const cancelled = payments.length > 0 && payments.every(p => p.deleted || ['DELETED', 'CANCELLED'].includes(p.status));
  const status = !payments.length ? 'NOT_FOUND' : refunded ? 'REFUNDED' : cancelled ? 'CANCELLED' : paid ? 'CONFIRMED' : 'PENDING';
  const cents = payments.reduce((sum, p) => sum + Math.round((p.originalValue ?? p.value) * 100), 0);
  return { status, paid, value: payments.length ? cents / 100 : null, billingType: payments[0]?.billingType ?? null, paymentIds: payments.map(p => p.id) };
}
