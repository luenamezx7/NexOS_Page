import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { config } from '@/config';
import {
  createPixLink,
  generateOrderNsu,
  isInfinitePayConfigured,
} from '@/lib/infinitepay';

// ============================================================
// NexOS — Pix via InfinitePay (taxa zero)
// POST /api/checkout/infinitepay { priceId, name, email }
//   → { paymentUrl, orderNsu, amount, currency }
// O amount vem do Stripe Price no servidor (nunca do client).
// O QR Pix aparece no checkout da InfinitePay (link externo).
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-03-25.dahlia' as unknown as Stripe.LatestApiVersion,
});

const bodySchema = z.object({
  priceId: z.string().min(1).startsWith('price_'),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
});

const ALLOWLIST = new Set([
  ...config.services.map((s) => s.stripePriceId),
  'price_1UGReeIG50KmD1h7kMbzamKD',
  'price_1UGRbBIG50KmD1h7of6JbYHd',
  'price_1UGVVWElCQS2D8A98bp4Va94',
  'price_1UGVVWElCQS2D8A9Wc8o23wQ',
]);

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
    { ok: isInfinitePayConfigured(), provider: 'infinitepay', method: 'pix', hasHandle: isInfinitePayConfigured() },
    { headers: securityHeaders() },
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, { status: 429, headers: securityHeaders() });
  }

  if (!isInfinitePayConfigured()) {
    console.error('[api/checkout/infinitepay] INFINITE_PAY_HANDLE não configurado');
    return NextResponse.json({ error: 'Pix temporariamente indisponível. Tente o cartão.' }, { status: 500, headers: securityHeaders() });
  }

  let priceId: string;
  let name: string;
  let email: string;
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders() });
    }
    ({ priceId, name, email } = parsed.data);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  if (!ALLOWLIST.has(priceId)) {
    console.warn('[api/checkout/infinitepay] priceId fora do allowlist:', priceId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  try {
    // Amount e descrição resolvidos no servidor (fonte: Stripe Price)
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.unit_amount === null) {
      return NextResponse.json({ error: 'Produto indisponível no momento.' }, { status: 400, headers: securityHeaders() });
    }

    let description = 'Produto NexOS';
    try {
      const productId = typeof price.product === 'string' ? price.product : (price.product as Stripe.Product).id;
      const product = await stripe.products.retrieve(productId);
      if (product.name) description = product.name.slice(0, 120);
    } catch {
      // silencioso — descrição fallback
    }

    const orderNsu = generateOrderNsu();
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const base = origin.replace(/\/$/, '');
    const redirectUrl = `${base}/sucesso?provider=infinitepay&order_nsu=${encodeURIComponent(orderNsu)}`;
    const webhookUrl = (process.env.INFINITE_PAY_WEBHOOK_URL ?? '').trim() || `${base}/api/webhooks/infinitepay`;

    const { paymentUrl } = await createPixLink({
      amountCents: price.unit_amount,
      description,
      orderNsu,
      customerName: name,
      customerEmail: email,
      redirectUrl,
      webhookUrl,
    });

    return NextResponse.json(
      { paymentUrl, orderNsu, amount: price.unit_amount, currency: price.currency },
      { status: 200, headers: securityHeaders() },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout/infinitepay] error', msg);
    return NextResponse.json({ error: 'Erro ao gerar Pix. Tente novamente ou use o cartão.' }, { status: 500, headers: securityHeaders() });
  }
}
