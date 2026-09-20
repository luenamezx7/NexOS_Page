import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentStatus, isAsaasConfigured } from '@/lib/asaas';

// ============================================================
// NexOS — polling do pagamento Asaas
// POST /api/checkout/status { paymentId | externalReference }
//   → { paid, status, value, billingType }
// ============================================================

const bodySchema = z
  .object({
    paymentId: z.string().min(1).max(40).optional(),
    externalReference: z.string().min(1).max(36).optional(),
  })
  .refine((d) => d.paymentId || d.externalReference, {
    message: 'Informe paymentId ou externalReference',
  });

const WINDOW_MS = 60_000;
const MAX_REQ = 20;
const buckets = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function headers(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self';",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const valid = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (valid.length >= MAX_REQ) {
    return NextResponse.json({ error: 'Muitas verificações. Aguarde um pouco.' }, { status: 429, headers: headers() });
  }
  valid.push(now);
  buckets.set(ip, valid);

  if (!isAsaasConfigured()) {
    return NextResponse.json({ error: 'Pagamentos indisponíveis.' }, { status: 500, headers: headers() });
  }

  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400, headers: headers() });
    }
    const { paymentId, externalReference } = parsed.data;
    const status = paymentId
      ? await getPaymentStatus(paymentId, 'id')
      : await getPaymentStatus(externalReference!, 'externalReference');
    return NextResponse.json(status, { status: 200, headers: headers() });
  } catch {
    return NextResponse.json({ error: 'Falha ao verificar pagamento.' }, { status: 500, headers: headers() });
  }
}
