import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================
// NexOS — webhook do Asaas (confirmação real-time)
// Configure em: Minha Conta > Integrações > Webhooks (Asaas)
// URL: {NEXT_PUBLIC_SITE_URL}/api/webhooks/checkout
// Eventos recomendados: PAYMENT_CONFIRMED, PAYMENT_RECEIVED,
// PAYMENT_OVERDUE, PAYMENT_REFUNDED
// O Asaas envia { event, payment: { id, externalReference, status, value, billingType } }
// Responda 200 rápido (<1s).
// ============================================================

const webhookSchema = z.object({
  event: z.string().min(1).max(40),
  payment: z.object({
    id: z.string().min(1).max(40),
    externalReference: z.string().min(1).max(36).optional().nullable(),
    status: z.string().min(1).max(32),
    value: z.number().optional(),
    billingType: z.string().optional(),
  }),
});

export async function GET() {
  return NextResponse.json({ ok: true, provider: 'asaas', hint: 'POST webhook events here' });
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn('[webhook/checkout] payload fora do shape:', JSON.stringify(payload).slice(0, 600));
    return NextResponse.json({ error: 'Shape inválido' }, { status: 400 });
  }

  const { event, payment } = parsed.data;
  console.info(
    `[webhook/checkout] ${event} payment=${payment.id} ref=${payment.externalReference ?? '?'} status=${payment.status} billingType=${payment.billingType ?? '?'} value=${payment.value ?? '?'}`,
  );

  // PAYMENT_CONFIRMED / PAYMENT_RECEIVED → marque pedido como PAGO no seu banco
  // usando payment.externalReference para localizar o pedido.
  // Sem DB no projeto atual: apenas log. Confirmação visível ao usuário vem do polling.

  return NextResponse.json({ ok: true }, { status: 200 });
}
