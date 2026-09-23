import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkUnitPrice } from '@/lib/bulk-pricing';
import { createAsaasPayment, generateExternalReference, isAsaasConfigured } from '@/lib/asaas';
import { isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';

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
  cpfCnpj: z.string().trim().min(11).max(18),
  billingType: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED']).optional().default('UNDEFINED'),
  installments: z.coerce.number().int().min(1).max(12).optional().default(1),
  quantity: z.coerce.number().int().min(1).max(BULK_MAX_QTY).optional().default(1),
  turnstileToken: z.string().optional(),
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
  let cpfCnpj: string;
  let billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  let installments: number;
  let quantity: number;
  let turnstileToken: string | undefined;
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders() });
    }
    ({ productId, name, email, cpfCnpj, billingType, installments, quantity, turnstileToken } = parsed.data);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  // Turnstile anti-bot (se configurado)
  if (isTurnstileEnforced()) {
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verificação de segurança obrigatória.' }, { status: 400, headers: securityHeaders() });
    }
    const v = await verifyTurnstileToken(turnstileToken, ip);
    if (!v.success) {
      return NextResponse.json({ error: 'Falha na verificação anti-bot.', details: v['error-codes']?.join(', ') }, { status: 403, headers: securityHeaders() });
    }
  }

  const cpfDigits = cpfCnpj.replace(/\D/g, '');
  if (cpfDigits.length !== 11 && cpfDigits.length !== 14) {
    return NextResponse.json({ error: 'CPF/CNPJ inválido. Use 11 dígitos (CPF) ou 14 (CNPJ).' }, { status: 400, headers: securityHeaders() });
  }

  const service = config.services.find((s) => s.id === productId);
  if (!service) {
    console.warn('[api/checkout] productId inválido:', productId);
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers: securityHeaders() });
  }

  const unitPrice = bulkUnitPrice(service.price, quantity, productId);
  const amount = Number((unitPrice * quantity).toFixed(2));
  if (!Number.isFinite(amount) || amount < 5) {
    return NextResponse.json({ error: 'Valor mínimo para cobrança no Asaas é R$ 5,00.' }, { status: 400, headers: securityHeaders() });
  }

  // Pix ainda em aprovação — bloqueia no servidor também
  if (billingType === 'PIX') {
    return NextResponse.json({ error: 'Pix em desenvolvimento — liberação pendente no Asaas.' }, { status: 400, headers: securityHeaders() });
  }

  // Parcelas: Asaas recebe value + installmentCount via API transparente; para UNDEFINED/BOLETO é sempre 1x
  const effectiveBillingType = billingType === 'CREDIT_CARD' ? 'CREDIT_CARD' : billingType === 'BOLETO' ? 'BOLETO' : 'UNDEFINED';

  try {
    const externalReference = generateExternalReference();

    const result = await createAsaasPayment({
      amount,
      description: (quantity > 1 ? `${service.title} x${quantity}` : service.title).slice(0, 120),
      externalReference,
      customerName: name,
      customerEmail: email,
      cpfCnpj: cpfDigits,
      billingType: effectiveBillingType,
    });

    // Para cartão com parcelas, o invoiceUrl já abre com parcelamento selecionado no iframe
    // O valor de parcelas é exibido no front via /api/checkout/installments, o Asaas calcula o total na página deles
    return NextResponse.json(
      {
        paymentUrl: result.invoiceUrl,
        paymentId: result.id,
        externalReference,
        amount: Math.round(amount * 100),
        currency: 'brl',
        billingType: result.billingType,
        bankSlipUrl: result.bankSlipUrl ?? null,
        identificationField: result.identificationField ?? null,
        installments: effectiveBillingType === 'CREDIT_CARD' ? installments : 1,
      },
      { status: 200, headers: securityHeaders() },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/checkout] Asaas error', msg);
    // Expõe detalhes de validação do Asaas (ex: CPF obrigatório, valor mínimo) sem vazar stack
    const isValidation = msg.includes('invalid_') || msg.includes('CPF') || msg.includes('mínimo') || msg.includes('R$ 5');
    return NextResponse.json({ error: isValidation ? msg.slice(0, 300) : 'Erro ao gerar cobrança. Tente novamente.' }, { status: 500, headers: securityHeaders() });
  }
}
