// ============================================================
// NexOS — Asaas (Pix / Boleto / Cartão) — helper server-side
// Docs: https://docs.asaas.com/
// API v3: sandbox https://sandbox.asaas.com/api/v3
//         prod    https://www.asaas.com/api/v3
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
  // No Windows local o CA do Node pode não conter o intermediário do Asaas (www.asaas.com),
  // causando UNABLE_TO_VERIFY_LEAF_SIGNATURE. Em produção (Vercel) funciona.
  // Tentamos fetch normal; se falhar por TLS, o erro será exposto para o caller
  // com dica para rodar `npm run dev` (que já usa --use-system-ca).
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...asaasHeaders(), ...(init.headers as Record<string, string> | undefined) },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause = (e as { cause?: { code?: string } })?.cause?.code ?? '';
    if (msg.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || cause === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || msg.includes('fetch failed')) {
      throw new Error(
        `Falha de TLS ao conectar em ${getApiBase()}. Rode local com "npm run dev" (já usa --use-system-ca) ou faça deploy na Vercel. Detalhe: ${msg.slice(0, 200)}`
      );
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('conexão') || cause === 'ECONNREFUSED') {
      throw new Error(`Conexão recusada em ${getApiBase()}. Verifique firewall/antivírus ou tente rede diferente. Detalhe: ${msg.slice(0, 200)}`);
    }
    throw e;
  }
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
  cpfCnpj?: string | null;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

async function findOrCreateCustomer(name: string, email: string, cpfCnpj: string): Promise<string> {
  const cpf = onlyDigits(cpfCnpj);
  // 1. Busca por email
  const search = (await asaasFetch(`/customers?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })) as { data?: AsaasCustomer[] };
  if (search.data && search.data.length > 0) {
    const existing = search.data[0];
    // Se já existe mas sem CPF, atualiza
    if (!existing.cpfCnpj && cpf.length >= 11) {
      const updated = (await asaasFetch(`/customers/${existing.id}`, {
        method: 'POST',
        body: JSON.stringify({ name, cpfCnpj: cpf }),
      })) as AsaasCustomer;
      return updated.id ?? existing.id;
    }
    return existing.id;
  }

  // 2. Cria com CPF/CNPJ
  const created = (await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj: cpf }),
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
  cpfCnpj: string;
  dueDate?: string; // YYYY-MM-DD, default amanhã
  billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
}

export interface CreatePaymentResult {
  id: string;
  invoiceUrl: string;
  externalReference: string;
  value: number;
  billingType: string;
  bankSlipUrl?: string | null;
  identificationField?: string | null;
  pixQrCodePayload?: string | null;
}

/** Flag para desabilitar Pix enquanto conta não aprovada — controla UI "Em desenvolvimento..." */
export function isPixEnabled(): boolean {
  // Quando Asaas liberar Pix, set ASAAS_PIX_ENABLED=true ou ASAAS_ENV=production com conta aprovada
  if (process.env.ASAAS_PIX_ENABLED === 'true') return true;
  if (process.env.ASAAS_PIX_ENABLED === 'false') return false;
  // Auto-detect: se ASAAS_ENV=production mas Pix falhou antes, mantém desabilitado por padrão até manual
  return false;
}

export interface InstallmentOption {
  installment: number;
  value: number;
  total: number;
}

/** Simula parcelas como o Asaas mostraria no redirect — sem juros para 1x, com juros Asaas aproximado para 2-12x */
export function simulateInstallments(value: number, maxInstallments = 12): InstallmentOption[] {
  const opts: InstallmentOption[] = [];
  for (let i = 1; i <= maxInstallments; i++) {
    // Asaas cobra ~1.99% a.m. para parcelado no cartão — aproximamos para UI; backend Asaas recalcula exato
    const total = i === 1 ? value : Number((value * (1 + 0.0199 * i)).toFixed(2));
    opts.push({ installment: i, value: Number((total / i).toFixed(2)), total });
  }
  return opts;
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createAsaasPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  if (!isAsaasConfigured()) throw new Error('ASAAS_API_KEY não configurado');

  const customerId = await findOrCreateCustomer(input.customerName, input.customerEmail, input.cpfCnpj);

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
  })) as {
    id: string;
    invoiceUrl: string;
    value: number;
    billingType: string;
    externalReference: string;
    bankSlipUrl?: string;
    identificationField?: string;
    pixQrCodePayload?: string;
  };

  if (!data.id || !data.invoiceUrl) throw new Error('Resposta inválida do Asaas ao criar cobrança');
  return {
    id: data.id,
    invoiceUrl: data.invoiceUrl,
    externalReference: data.externalReference ?? input.externalReference,
    value: data.value,
    billingType: data.billingType,
    bankSlipUrl: data.bankSlipUrl ?? null,
    identificationField: data.identificationField ?? null,
    pixQrCodePayload: data.pixQrCodePayload ?? null,
  };
}

export interface PaymentStatusResult {
  status: string;
  paid: boolean;
  value: number | null;
  billingType: string | null;
}

export async function getPaymentBillingInfo(paymentId: string): Promise<{ bankSlipUrl: string | null; identificationField: string | null; invoiceUrl: string | null }> {
  const data = (await asaasFetch(`/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' })) as {
    bankSlipUrl?: string;
    identificationField?: string;
    invoiceUrl?: string;
  };
  return {
    bankSlipUrl: data.bankSlipUrl ?? null,
    identificationField: data.identificationField ?? null,
    invoiceUrl: data.invoiceUrl ?? null,
  };
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
