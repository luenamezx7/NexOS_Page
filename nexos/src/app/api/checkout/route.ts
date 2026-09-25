import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkUnitPrice } from '@/lib/bulk-pricing';
import { createAsaasPayment, generateExternalReference, isAsaasConfigured, isPixEnabled } from '@/lib/asaas';
import { isTurnstileConfigured, isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHash, createHmac } from 'node:crypto';
import { issueStatusToken, secret as statusSecret } from '@/lib/status-token';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';
import { getUserAccess } from '@/lib/auth/user';

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
  turnstileToken: z.string().max(2048).nullish(),
});

const WINDOW_MS = 60_000;
const MAX_REQ = 8;
const buckets = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // @ts-expect-error NextRequest ip fallback
  return (req.ip as string) ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (buckets.size >= 5000) {
    for (const [key, times] of buckets) if (times.every(t => now - t >= WINDOW_MS)) buckets.delete(key);
    if (buckets.size >= 5000 && !buckets.has(ip)) return true;
  }
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
    'Cache-Control': 'private, no-store',
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: isAsaasConfigured(),
      provider: 'asaas',
      hasKey: isAsaasConfigured(),
      turnstileRequired: isTurnstileEnforced(),
      products: config.services.map((s) => ({ id: s.id, title: s.title, price: s.price })),
    },
    { headers: securityHeaders() },
  );
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403, headers: securityHeaders() });
  // Regra de negócio: checkout exige conta criada + login (e e-mail confirmado).
  // 401/403 com callbackUrl sinaliza o client para redirecionar e voltar após o auth.
  const access = await getUserAccess();
  if (!access.ok) {
    return NextResponse.json(
      {
        error: access.status === 503
          ? 'Não foi possível verificar sua sessão. Tente novamente em instantes.'
          : access.reason === 'mfa'
          ? 'Confirme a autenticação em duas etapas para continuar.'
          : 'Faça login ou crie sua conta para finalizar a compra.',
        callbackUrl: '/portal/acesso',
        reason: access.reason ?? 'unauthenticated',
      },
      { status: access.status === 503 ? 503 : 401, headers: securityHeaders() },
    );
  }
  const idempotencyKey = req.headers.get('idempotency-key');
  if (!idempotencyKey || !z.string().uuid().safeParse(idempotencyKey).success) {
    return NextResponse.json({ error: 'Chave de tentativa inválida.' }, { status: 400, headers: securityHeaders() });
  }
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, { status: 429, headers: securityHeaders() });
  }

  if (!isAsaasConfigured()) {
    console.error('[api/checkout] ASAAS_API_KEY não configurado');
    return NextResponse.json({ error: 'Gateway de pagamentos (Asaas) não está configurado. Contate o suporte.' }, { status: 503, headers: securityHeaders() });
  }

  let productId: string;
  let name: string;
  let email: string;
  let cpfCnpj: string;
  let billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  let installments: number;
  let quantity: number;
  let turnstileToken: string | null | undefined;
  try {
    const body = await readJsonBody(req);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      console.warn('[api/checkout] validação falhou', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.code}`).slice(0, 5));
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400, headers: securityHeaders() });
    }
    ({ productId, name, email, cpfCnpj, billingType, installments, quantity, turnstileToken } = parsed.data);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status, headers: securityHeaders() });
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: securityHeaders() });
  }

  // Turnstile anti-bot (se configurado)
  if (isTurnstileEnforced()) {
    if (!isTurnstileConfigured()) return NextResponse.json({ error: 'Verificação de segurança não está configurada.' }, { status: 503, headers: securityHeaders() });
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verificação de segurança obrigatória.' }, { status: 400, headers: securityHeaders() });
    }
    const v = await verifyTurnstileToken(turnstileToken, ip).catch(() => ({ success: false }));
    if (!v.success) {
      return NextResponse.json({ error: 'Falha na verificação anti-bot.' }, { status: 403, headers: securityHeaders() });
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

  if (billingType === 'PIX' && !isPixEnabled()) {
    return NextResponse.json({ error: 'Pix em desenvolvimento — liberação pendente no Asaas.' }, { status: 400, headers: securityHeaders() });
  }

  // Parcelas: Asaas recebe value + installmentCount via API transparente; para UNDEFINED/BOLETO é sempre 1x
  const effectiveBillingType = billingType === 'CREDIT_CARD' ? 'CREDIT_CARD' : billingType === 'BOLETO' ? 'BOLETO' : 'UNDEFINED';

  const keyHash = createHash('sha256').update(idempotencyKey).digest('hex');
  let reserved = false;
  try {
    const externalReference = generateExternalReference();
    // Validate signing configuration before any external charge is created.
    const { token: statusToken } = issueStatusToken(externalReference);
    const db = createAdminClient();
    const payloadHash = createHmac('sha256', statusSecret()).update(JSON.stringify({ productId, name, email, cpfDigits, billingType, installments, quantity })).digest('hex');
    const { error: reservationError } = await db.from('idempotency_keys').insert({
      key_hash: keyHash,
      payload_hash: payloadHash,
      provider_reference: externalReference,
      ...(access.ok && access.userId ? { owner_id: access.userId } : {}),
    });
    if (reservationError) {
      if (reservationError.code !== '23505') throw reservationError;
       const { data: previous, error } = await db.from('idempotency_keys').select('owner_id,payload_hash,status,result').eq('key_hash', keyHash).single();
       if (error) throw error;
       if (previous.owner_id !== access.userId) return NextResponse.json({ error: 'Esta tentativa não está disponível para esta conta.' }, { status: 409, headers: securityHeaders() });
      if (previous.payload_hash !== payloadHash) return NextResponse.json({ error: 'Esta tentativa já foi usada com outros dados.' }, { status: 409, headers: securityHeaders() });
      if (previous.status === 'succeeded' && previous.result) return NextResponse.json(previous.result, { headers: securityHeaders() });
      return NextResponse.json({ error: 'Cobrança em processamento ou aguardando conciliação. Não gere outra tentativa.' }, { status: 409, headers: securityHeaders() });
    }
    reserved = true;
    const ownerColumns =
      access.ok && access.userId ? { owner_id: access.userId } : {};
    const { error: orderError } = await db.from('orders').insert({
      amount_cents: Math.round(amount * 100),
      product_id: productId,
      quantity,
      billing_type: effectiveBillingType,
      external_reference: externalReference,
      ...ownerColumns,
    });
    if (orderError) throw orderError;

    const result = await createAsaasPayment({
      amount,
      description: (quantity > 1 ? `${service.title} x${quantity}` : service.title).slice(0, 120),
      externalReference,
      customerName: name,
      customerEmail: email,
      cpfCnpj: cpfDigits,
      billingType: effectiveBillingType,
      installments: effectiveBillingType === 'CREDIT_CARD' ? installments : undefined,
    });

    // Para cartão com parcelas, o invoiceUrl já abre com parcelamento selecionado no iframe
    // O valor de parcelas é exibido no front via /api/checkout/installments, o Asaas calcula o total na página deles
    const responseBody = {
        paymentUrl: result.invoiceUrl,
        paymentId: result.id,
        externalReference,
        statusToken,
        amount: Math.round(amount * 100),
        currency: 'brl',
        billingType: result.billingType,
        bankSlipUrl: result.bankSlipUrl ?? null,
        identificationField: result.identificationField ?? null,
        installments: effectiveBillingType === 'CREDIT_CARD' ? installments : 1,
      };
    const { error: updateError } = await db.from('orders').update({ payment_id: result.id, status: 'processing' }).eq('external_reference', externalReference);
    if (updateError) throw updateError;
    const { error: saveError } = await db.from('idempotency_keys').update({ status: 'succeeded', result: responseBody }).eq('key_hash', keyHash);
    if (saveError) throw saveError;
    return NextResponse.json(responseBody, { status: 200, headers: securityHeaders() });
  } catch (err) {
    if (reserved) {
      try { await createAdminClient().from('idempotency_keys').update({ status: 'unknown' }).eq('key_hash', keyHash); } catch {}
    }
    console.error('[api/checkout] falha na cobrança', err instanceof Error ? err.name : 'ProviderError');
    const fallbackMsg = reserved
      ? 'Não foi possível confirmar a cobrança. Aguarde a conciliação antes de gerar outra.'
      : 'O gateway de pagamentos não respondeu. Tente novamente em alguns instantes.';
    return NextResponse.json({ error: fallbackMsg }, { status: reserved ? 409 : 503, headers: securityHeaders() });
  }
}
