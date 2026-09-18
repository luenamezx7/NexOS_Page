import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { config } from '@/config';

// ============================================================
// NexOS — Checkout Transparente via Checkout Sessions + Elements
// Stripe recomenda Checkout Sessions (ui_mode custom) sobre PaymentIntents:
// cobre price_data, line_items, tax, Adaptive Pricing, etc.
// PCI-DSS: client_secret alimenta Checkout SDK (iFrame), nunca raw PAN.
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-03-25.dahlia' as unknown as Stripe.LatestApiVersion,
});

const bodySchema = z.object({
  priceId: z.string().min(1).startsWith('price_'),
});

const ALLOWLIST = new Set([
  ...config.services.map((s) => s.stripePriceId),
  // allow both test and live priceIds (test ↔ live switch)
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
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return false;
}

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.stripe.com;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export async function GET(req: NextRequest) {
  const hasToken = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishable = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const tokenPreview = process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.slice(0, 7)}...${process.env.STRIPE_SECRET_KEY.slice(-4)}` : null;
  return NextResponse.json(
    { ok: hasToken && hasPublishable, hasToken, hasPublishable, tokenPreview, allowlist: [...ALLOWLIST], mode: 'checkout_sessions_custom' },
    { headers: securityHeaders() }
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, { status: 429, headers: securityHeaders() });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[api/checkout] STRIPE_SECRET_KEY não configurado');
    return NextResponse.json({ error: 'Pagamentos temporariamente indisponíveis.' }, { status: 500, headers: securityHeaders() });
  }

  let priceId: string;
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'priceId inválido', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders() });
    }
    priceId = parsed.data.priceId;
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  if (!ALLOWLIST.has(priceId)) {
    console.warn('[api/checkout] priceId fora do allowlist:', priceId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  try {
    // Valida Price no servidor (nunca confia no client) e busca produto para imagem
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) {
      return NextResponse.json({ error: 'Produto indisponível no momento.' }, { status: 400, headers: securityHeaders() });
    }
    if (price.unit_amount === null) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400, headers: securityHeaders() });
    }

    // Busca produto para expor imagem/título no checkout embarcado
    let productImage: string | null = null;
    let productName: string | null = null;
    try {
      const productId = typeof price.product === 'string' ? price.product : (price.product as Stripe.Product).id;
      const product = await stripe.products.retrieve(productId);
      productName = product.name ?? null;
      productImage = product.images?.[0] ?? null;
    } catch {
      // silencioso — imagem é opcional
    }

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const returnUrl = `${origin.replace(/\/$/, '')}/sucesso?session_id={CHECKOUT_SESSION_ID}`;

    // Checkout Sessions com ui_mode elements → alimenta Checkout SDK (Payment Element)
    // Stripe recomenda este fluxo sobre PaymentIntents (Adaptive Pricing, tax, etc.)
    // Somente cartão aqui — o Pix roda na aba InfinitePay (taxa zero).
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'elements' as const,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      payment_method_types: ['card'],
      return_url: returnUrl,
    });

    if (!session.client_secret) {
      return NextResponse.json({ error: 'Falha ao inicializar checkout.' }, { status: 500, headers: securityHeaders() });
    }

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
        sessionId: session.id,
        amount: price.unit_amount,
        currency: price.currency,
        productImage,
        productName,
      },
      { status: 200, headers: securityHeaders() }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] Stripe error', msg, err);
    const raw = (err as unknown as { raw?: unknown })?.raw ?? (err as unknown as { code?: string })?.code;
    return NextResponse.json({ error: 'Erro ao inicializar checkout.', details: raw ?? msg }, { status: 500, headers: securityHeaders() });
  }
}
