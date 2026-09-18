import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/config';
import {
  createPixLink,
  generateOrderNsu,
  isInfinitePayConfigured,
} from '@/lib/infinitepay';

// ============================================================
// NexOS — Checkout Pix via InfinitePay (taxa zero)
// POST /api/checkout { productId, name, email }
//   → { paymentUrl, orderNsu, amount, currency }
// Amount (centavos) resolvido no servidor a partir do catálogo
// em config.services — nunca do client.
// ============================================================

const bodySchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
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
      ok: isInfinitePayConfigured(),
      provider: 'infinitepay',
      method: 'pix',
      hasHandle: isInfinitePayConfigured(),
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

  if (!isInfinitePayConfigured()) {
    console.error('[api/checkout] INFINITE_PAY_HANDLE não configurado');
    return NextResponse.json({ error: 'Pagamentos temporariamente indisponíveis.' }, { status: 500, headers: securityHeaders() });
  }

  let productId: string;
  let name: string;
  let email: string;
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders() });
    }
    ({ productId, name, email } = parsed.data);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  const service = config.services.find((s) => s.id === productId);
  if (!service) {
    console.warn('[api/checkout] productId inválido:', productId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  const amountCents = Math.round(service.price * 100);
  if (!Number.isFinite(amountCents) || amountCents < 1) {
    return NextResponse.json({ error: 'Preço inválido.' }, { status: 400, headers: securityHeaders() });
  }

  try {
    const orderNsu = generateOrderNsu();
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const base = origin.replace(/\/$/, '');
    const redirectUrl = `${base}/sucesso?provider=infinitepay&order_nsu=${encodeURIComponent(orderNsu)}`;
    const webhookUrl = (process.env.INFINITE_PAY_WEBHOOK_URL ?? '').trim() || `${base}/api/webhooks/checkout`;

    const { paymentUrl } = await createPixLink({
      amountCents,
      description: service.title.slice(0, 120),
      orderNsu,
      customerName: name,
      customerEmail: email,
      redirectUrl,
      webhookUrl,
    });

    return NextResponse.json(
      { paymentUrl, orderNsu, amount: amountCents, currency: 'brl' },
      { status: 200, headers: securityHeaders() },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] InfinitePay error', msg);
    return NextResponse.json({ error: 'Erro ao gerar Pix. Tente novamente.' }, { status: 500, headers: securityHeaders() });
  }
}
