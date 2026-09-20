import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkUnitPrice } from '@/lib/bulk-pricing';
import { createAsaasPayment, generateExternalReference, isAsaasConfigured } from '@/lib/asaas';

// ============================================================
// NexOS — Checkout via Asaas (PIX / Boleto / Cartão)
// POST /api/checkout { productId, name, email, quantity? }
//   → { paymentUrl, externalReference, paymentId, amount, currency }
// Amount (reais) resolvido no servidor a partir do catálogo
// em config.services × quantity — nunca do client.
// ============================================================

const bodySchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  quantity: z.coerce.number().int().min(1).max(BULK_MAX_QTY).optional().default(1),
});

const WINDOW_MS = 60_000;
const MAX_REQ = 8;
const buckets = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // @ts-expect-error NextRequest ip fallback
  return (req.ip as string) ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = buckets.get(ip) ?? [];
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);
  if (valid.length >= MAX_REQ) {
    buckets.set(ip, valid);
    return true;
  }
  valid.push(now);
  buckets.set(ip, valid);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return false;
}

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: isAsaasConfigured(),
      provider: 'asaas',
      hasKey: isAsaasConfigured(),
      products: config.services.map((s) => ({ id: s.id, title: s.title, price: s.price })),
    },
    { headers: securityHeaders() },
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, { status: 429, headers: securityHeaders() });
  }

  if (!isAsaasConfigured()) {
    console.error('[api/checkout] ASAAS_API_KEY não configurado');
    return NextResponse.json({ error: 'Pagamentos temporariamente indisponíveis.' }, { status: 500, headers: securityHeaders() });
  }

  let productId: string;
  let name: string;
  let email: string;
  let quantity: number;
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders() });
    }
    ({ productId, name, email, quantity } = parsed.data);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  const service = config.services.find((s) => s.id === productId);
  if (!service) {
    console.warn('[api/checkout] productId inválido:', productId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  const unitPrice = bulkUnitPrice(service.price, quantity, productId);
  const amount = Number((unitPrice * quantity).toFixed(2));
  if (!Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ error: 'Preço inválido.' }, { status: 400, headers: securityHeaders() });
  }

  try {
    const externalReference = generateExternalReference();

    const { invoiceUrl, id } = await createAsaasPayment({
      amount,
      description: (quantity > 1 ? `${service.title} x${quantity}` : service.title).slice(0, 120),
      externalReference,
      customerName: name,
      customerEmail: email,
      billingType: 'UNDEFINED',
    });

    return NextResponse.json(
      { paymentUrl: invoiceUrl, paymentId: id, externalReference, amount: Math.round(amount * 100), currency: 'brl' },
      { status: 200, headers: securityHeaders() },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] Asaas error', msg);
    return NextResponse.json({ error: 'Erro ao gerar cobrança. Tente novamente.' }, { status: 500, headers: securityHeaders() });
  }
}
