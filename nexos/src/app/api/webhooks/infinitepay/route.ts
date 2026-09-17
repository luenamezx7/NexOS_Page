import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================
// NexOS — webhook da InfinitePay (confirmação em tempo real)
// A InfinitePay POSTA aqui quando o pagamento aprova:
// { invoice_slug, amount, paid_amount, installments, capture_method,
//   transaction_nsu, order_nsu, receipt_url, items }
// Responda 200 rápido (<1s). Responder 400 faz ela tentar de novo.
// Sem banco de dados: validamos o shape, registramos o log e
// a confirmação visível ao usuário vem do polling de status.
// ============================================================

const webhookSchema = z.object({
  invoice_slug: z.string().min(1).max(120),
  amount: z.number().int().nonnegative(),
  paid_amount: z.number().int().nonnegative().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  capture_method: z.string().min(1).max(32).optional(),
  transaction_nsu: z.string().min(1).max(120),
  order_nsu: z.string().min(1).max(36),
  receipt_url: z.string().url().max(500).optional(),
});

export async function GET() {
  return NextResponse.json({ ok: true, provider: 'infinitepay', hint: 'POST webhook events here' });
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
    console.warn('[webhook/infinitepay] payload fora do shape:', JSON.stringify(payload).slice(0, 400));
    return NextResponse.json({ error: 'Shape inválido' }, { status: 400 });
  }

  const { order_nsu, capture_method, paid_amount, transaction_nsu } = parsed.data;
  console.info(
    `[webhook/infinitepay] pago order_nsu=${order_nsu} via=${capture_method ?? '?'} valor=${paid_amount ?? '?'} txn=${transaction_nsu}`,
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
