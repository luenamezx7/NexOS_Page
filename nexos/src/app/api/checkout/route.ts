import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-11-17.clover' as unknown as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY não configurado no servidor' }, { status: 500 });
    }

    const body: unknown = await req.json();
    const priceId = (body as { priceId?: string })?.priceId;

    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return NextResponse.json({ error: 'priceId inválido' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Fallback para headers se SITE_URL não estiver setado e estiver no Vercel
    const origin = req.headers.get('origin') ?? siteUrl;

    const successUrl = `${origin.replace(/\/$/, '')}/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin.replace(/\/$/, '')}/cancelado`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] error', msg, err);
    const raw = (err as unknown as { raw?: unknown })?.raw ?? (err as unknown as { type?: string })?.type;
    return NextResponse.json({ error: msg, details: raw }, { status: 500 });
  }
}
