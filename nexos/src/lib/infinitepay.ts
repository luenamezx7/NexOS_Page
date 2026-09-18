// ============================================================
// NexOS — InfinitePay (Pix taxa zero) — helper server-side
// Docs: https://www.infinitepay.io/checkout-documentacao
// - POST /links          → cria link de pagamento (QR Pix na página deles)
// - POST /payment_check  → consulta status (polling, sem webhook obrigatório)
// - Webhook (opcional)   → POST no webhook_url com invoice_slug etc.
// Preço NUNCA vem do client: o amount é resolvido no servidor a
// partir do catálogo em config.services (id do produto), em centavos.
// ============================================================

const LINKS_URL = 'https://api.checkout.infinitepay.io/links';
const STATUS_URL = 'https://api.checkout.infinitepay.io/payment_check';
const FETCH_TIMEOUT_MS = 15_000;

export function getInfinitePayHandle(): string | null {
  const handle = (process.env.INFINITE_PAY_HANDLE ?? '').trim().replace(/^\$/, '');
  return handle.length > 0 ? handle : null;
}

export function isInfinitePayConfigured(): boolean {
  return getInfinitePayHandle() !== null;
}

/** order_nsu único, dentro do formato ^([a-zA-Z0-9-]+$) e ≤ 36 chars. */
export function generateOrderNsu(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `nexos-${Date.now().toString(36)}-${rand}`.slice(0, 36);
}

export interface CreatePixLinkInput {
  amountCents: number;
  description: string;
  orderNsu: string;
  customerName: string;
  customerEmail: string;
  redirectUrl: string;
  webhookUrl: string;
}

export interface CreatePixLinkResult {
  paymentUrl: string;
}

export async function createPixLink(input: CreatePixLinkInput): Promise<CreatePixLinkResult> {
  const handle = getInfinitePayHandle();
  if (!handle) throw new Error('INFINITE_PAY_HANDLE não configurado');

  const res = await fetch(LINKS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      order_nsu: input.orderNsu,
      redirect_url: input.redirectUrl,
      webhook_url: input.webhookUrl,
      customer: { name: input.customerName, email: input.customerEmail },
      items: [{ quantity: 1, price: input.amountCents, description: input.description }],
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  const body: unknown = await res.json().catch(() => ({}));
  const url =
    typeof body === 'object' && body !== null
      ? (body as { url?: unknown }).url
      : undefined;

  if (!res.ok || typeof url !== 'string' || url.length === 0) {
    throw new Error('Falha ao gerar link Pix na InfinitePay.');
  }
  return { paymentUrl: url };
}

export interface PixStatusQuery {
  orderNsu?: string;
  slug?: string;
  transactionNsu?: string;
}

export interface PixStatusResult {
  paid: boolean;
  captureMethod: string | null;
  amount: number | null;
  paidAmount: number | null;
}

/** Consulta aceita order_nsu, slug (código da fatura) ou transaction_nsu. */
export async function checkPixStatus(query: PixStatusQuery): Promise<PixStatusResult> {
  const handle = getInfinitePayHandle();
  if (!handle) throw new Error('INFINITE_PAY_HANDLE não configurado');

  const res = await fetch(STATUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      ...(query.orderNsu ? { order_nsu: query.orderNsu } : {}),
      ...(query.slug ? { slug: query.slug } : {}),
      ...(query.transactionNsu ? { transaction_nsu: query.transactionNsu } : {}),
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok || typeof body !== 'object' || body === null) {
    throw new Error('Falha ao consultar status do Pix.');
  }
  const b = body as { paid?: unknown; capture_method?: unknown; amount?: unknown; paid_amount?: unknown };
  return {
    paid: b.paid === true,
    captureMethod: typeof b.capture_method === 'string' ? b.capture_method : null,
    amount: typeof b.amount === 'number' ? b.amount : null,
    paidAmount: typeof b.paid_amount === 'number' ? b.paid_amount : null,
  };
}
