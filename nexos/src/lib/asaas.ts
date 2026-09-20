// ============================================================
// NexOS — Asaas (Pix / Boleto / Cartão) — helper server-side
// Docs: https://docs.asaas.com/
// API v3: sandbox https://sandbox.asaas.com/api/v3
//         prod    https://api.asaas.com/api/v3
// Preço NUNCA vem do client: amount resolvido no servidor a
// partir do catálogo em config.services (id do produto).
// ============================================================

const SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';
const PROD_URL = 'https://www.asaas.com/api/v3';
const FETCH_TIMEOUT_MS = 15_000;

function getApiBase(): string {
  return (process.env.ASAAS_ENV ?? 'sandbox').toLowerCase() === 'production' ||
    (process.env.ASAAS_ENV ?? '').toLowerCase() === 'prod'
    ? PROD_URL
    : SANDBOX_URL;
}

function getApiKey(): string | null {
  const k = (process.env.ASAAS_API_KEY ?? '').trim();
  return k.length > 0 ? k : null;
}

export function isAsaasConfigured(): boolean {
  return getApiKey() !== null;
}

export function getAsaasEnv(): 'sandbox' | 'production' {
  return getApiBase() === PROD_URL ? 'production' : 'sandbox';
}

/** externalReference único — usado para conciliação. */
export function generateExternalReference(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `nexos-${Date.now().toString(36)}-${rand}`.slice(0, 36);
}

function asaasHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) throw new Error('ASAAS_API_KEY não configurado');
  return {
    access_token: key,
    'Content-Type': 'application/json',
  };
}

async function asaasFetch(path: string, init: RequestInit): Promise<unknown> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...asaasHeaders(), ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && 'errors' in body
        ? JSON.stringify((body as { errors: unknown }).errors).slice(0, 400)
        : `Asaas ${res.status} em ${path}`;
    throw new Error(msg);
  }
  return body;
}

// ── Customers ───────────────────────────────────────────────

interface AsaasCustomer {
  id: string;
  email: string;
}

async function findOrCreateCustomer(name: string, email: string): Promise<string> {
  // 1. Busca por email
  const search = (await asaasFetch(`/customers?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })) as { data?: AsaasCustomer[] };
  if (search.data && search.data.length > 0) return search.data[0].id;

  // 2. Cria
  const created = (await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  })) as AsaasCustomer;
  if (!created.id) throw new Error('Falha ao criar cliente no Asaas');
  return created.id;
}

// ── Payments ────────────────────────────────────────────────

export interface CreatePaymentInput {
  amount: number; // em reais (ex: 69.90) — Asaas usa decimais
  description: string;
  externalReference: string;
  customerName: string;
  customerEmail: string;
  dueDate?: string; // YYYY-MM-DD, default amanhã
  billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
}

export interface CreatePaymentResult {
  id: string;
  invoiceUrl: string;
  externalReference: string;
  value: number;
  billingType: string;
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createAsaasPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  if (!isAsaasConfigured()) throw new Error('ASAAS_API_KEY não configurado');

  const customerId = await findOrCreateCustomer(input.customerName, input.customerEmail);

  const payload = {
    customer: customerId,
    billingType: input.billingType ?? 'UNDEFINED',
    value: input.amount,
    dueDate: input.dueDate ?? tomorrowISO(),
    description: input.description.slice(0, 120),
    externalReference: input.externalReference,
  };

  const data = (await asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as { id: string; invoiceUrl: string; value: number; billingType: string; externalReference: string };

  if (!data.id || !data.invoiceUrl) throw new Error('Resposta inválida do Asaas ao criar cobrança');
  return {
    id: data.id,
    invoiceUrl: data.invoiceUrl,
    externalReference: data.externalReference ?? input.externalReference,
    value: data.value,
    billingType: data.billingType,
  };
}

export interface PaymentStatusResult {
  status: string;
  paid: boolean;
  value: number | null;
  billingType: string | null;
}

export async function getPaymentStatus(
  idOrRef: string,
  by: 'id' | 'externalReference' = 'id',
): Promise<PaymentStatusResult> {
  if (!isAsaasConfigured()) throw new Error('ASAAS_API_KEY não configurado');

  let payment: { id: string; status: string; value: number; billingType: string } | null = null;

  if (by === 'externalReference') {
    const list = (await asaasFetch(`/payments?externalReference=${encodeURIComponent(idOrRef)}`, {
      method: 'GET',
    })) as { data?: Array<{ id: string; status: string; value: number; billingType: string }> };
    payment = list.data?.[0] ?? null;
    if (!payment) return { status: 'NOT_FOUND', paid: false, value: null, billingType: null };
  } else {
    payment = (await asaasFetch(`/payments/${encodeURIComponent(idOrRef)}`, {
      method: 'GET',
    })) as { id: string; status: string; value: number; billingType: string };
  }

  const paidStatuses = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
  return {
    status: payment.status,
    paid: paidStatuses.has(payment.status),
    value: payment.value ?? null,
    billingType: payment.billingType ?? null,
  };
}
