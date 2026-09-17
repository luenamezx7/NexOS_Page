import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { config } from '@/config';

// ============================================================
// NexOS — Checkout Transparente (PCI-DSS Compliant)
// Server-side PaymentIntent creation only. Never trust client amount.
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-11-17.clover' as unknown as Stripe.LatestApiVersion,
});

const bodySchema = z.object({
  priceId: z.string().min(1).startsWith('price_'),
});

// Allowlist: só priceIds configurados no catálogo podem ser cobrados
const ALLOWLIST = new Set(config.services.map((s) => s.stripePriceId));

// --- Rate Limiting (in-memory, por IP) ---
// 8 req / 60s por IP. Suficiente para uso legítimo, bloqueia burst/abuso.
// Em produção multi-instância, troque por Redis/Upstash.
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
  // limpeza periódica para não vazar memória
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return false;
}

// --- Security Headers para o checkout ---
function securityHeaders(): Record<string, string> {
  return {
    // CSP restritivo: só permite frames/scripts do Stripe
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.stripe.com;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// Diagnóstico (GET) — verifica envs sem vazar segredo
export async function GET(req: NextRequest) {
  const hasToken = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishable = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const tokenPreview = process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.slice(0, 7)}...${process.env.STRIPE_SECRET_KEY.slice(-4)}` : null;
  return NextResponse.json(
    { ok: hasToken && hasPublishable, hasToken, hasPublishable, tokenPreview, allowlist: [...ALLOWLIST] },
    { headers: securityHeaders() }
  );
}

export async function POST(req: NextRequest) {
  // Rate limiting
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

  // Validação de integridade: só allowlist
  if (!ALLOWLIST.has(priceId)) {
    console.warn('[api/checkout] priceId fora do allowlist:', priceId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  try {
    // Busca o Price no Stripe para validar valor/moeda no servidor (nunca confia no client)
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) {
      return NextResponse.json({ error: 'Produto indisponível no momento.' }, { status: 400, headers: securityHeaders() });
    }
    if (price.unit_amount === null || price.unit_amount === 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400, headers: securityHeaders() });
    }

    // Cria PaymentIntent — amount/currency vêm do Price, não do client
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        priceId,
        productId: typeof price.product === 'string' ? price.product : (price.product as Stripe.Product).id,
        source: 'nexos-embedded-checkout',
      },
      // Evita salvar cartão por padrão; tokenização acontece no client via Elements
      // Se quiser salvar, use setup_future_usage com consentimento explícito
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: 'Falha ao inicializar pagamento.' }, { status: 500, headers: securityHeaders() });
    }

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        amount: price.unit_amount,
        currency: price.currency,
      },
      { status: 200, headers: securityHeaders() }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] Stripe error', msg, err);
    const raw = (err as unknown as { raw?: unknown })?.raw ?? (err as unknown as { code?: string })?.code;
    // Não vazar detalhes internos de Stripe para o client em produção — loga server, retorna genérico + código
    return NextResponse.json({ error: 'Erro ao inicializar pagamento.', details: raw ?? msg }, { status: 500, headers: securityHeaders() });
  }
}
