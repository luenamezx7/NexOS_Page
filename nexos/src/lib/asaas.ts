import 'server-only';
import { randomBytes } from 'node:crypto';
import { summarizePayments, type ProviderPayment } from './payment-status';

const SANDBOX_URL = 'https://api-sandbox.asaas.com/v3';
const PROD_URL = 'https://api.asaas.com/v3';
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

export function generateExternalReference(): string {
  const rand = randomBytes(32).toString('base64url').slice(0, 18);
  return `nexos-${Date.now().toString(36)}-${rand}`.slice(0, 36);
}

function asaasHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) throw new Error('ASAAS_API_KEY não configurado');
  return {
    access_token: key,
    'Content-Type': 'application/json',
    'User-Agent': 'NexOS/1.0',
  };
}

const PROD_URL_ALT = 'https://asaas.com/api/v3';

async function asaasFetch(path: string, init: RequestInit): Promise<unknown> {
  const bases = getApiBase() === PROD_URL ? [PROD_URL, PROD_URL_ALT] : [getApiBase()];
  let lastErr: unknown = null;
  for (const base of bases) {
    const url = `${base}${path}`;
    try {
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
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const cause = (e as { cause?: { code?: string } })?.cause?.code ?? '';
      const isTls = msg.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || cause === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || msg.includes('fetch failed');
      const isConn = msg.includes('ECONNREFUSED') || cause === 'ECONNREFUSED';
      // A failed POST may already have created a charge. Never retry it automatically.
      if (init.method === 'GET' && (isTls || isConn) && base !== bases[bases.length - 1]) continue;
      if (isTls) {
        throw new Error(`Falha de TLS ao conectar em ${base}. Rode local com "npm run dev" (--use-system-ca) ou faça deploy na Vercel. Detalhe: ${msg.slice(0, 200)}`);
      }
      if (isConn) {
        throw new Error(`Conexão recusada em ${base}. Verifique firewall/antivírus. Detalhe: ${msg.slice(0, 200)}`);
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ── Customer identity ──────────────────────────────

interface AsaasCustomer {
  id: string;
  email: string;
  cpfCnpj?: string | null;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

export type VerifiedCustomerBinding = {
  applicationUserId: string;
  providerCustomerId: string;
};

export type CheckoutIdentity =
  | { kind: 'verified-user'; binding: VerifiedCustomerBinding }
  | { kind: 'guest'; checkoutSessionId: string };

async function createCustomer(name: string, email: string, cpfCnpj: string): Promise<string> {
  const cpf = onlyDigits(cpfCnpj);
  const created = (await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj: cpf }),
  })) as AsaasCustomer;
  if (!created.id) throw new Error('Falha ao criar cliente no Asaas');
  return created.id;
}

export async function resolveCustomerIdentity(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  applicationUserId?: string;
  checkoutSessionId?: string;
}): Promise<{ customerId: string; identity: CheckoutIdentity }> {
  const customerId = await createCustomer(input.name, input.email, input.cpfCnpj);
  const identity: CheckoutIdentity = input.applicationUserId
    ? { kind: 'verified-user', binding: { applicationUserId: input.applicationUserId, providerCustomerId: customerId } }
    : { kind: 'guest', checkoutSessionId: input.checkoutSessionId ?? randomBytes(32).toString('base64url') };
  return { customerId, identity };
}

// ── Payments ────────────────────────────────────────

export interface CreatePaymentInput {
  amount: number;
  description: string;
  externalReference: string;
  customerName: string;
  customerEmail: string;
  cpfCnpj: string;
  dueDate?: string;
  billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  installments?: number;
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

export function isPixEnabled(): boolean {
  if (process.env.ASAAS_PIX_ENABLED === 'true') return true;
  if (process.env.ASAAS_PIX_ENABLED === 'false') return false;
  return false;
}

export interface InstallmentOption {
  installment: number;
  value: number;
  total: number;
}

export function simulateInstallments(value: number, maxInstallments = 12): InstallmentOption[] {
  const opts: InstallmentOption[] = [];
  for (let i = 1; i <= maxInstallments; i++) {
    const total = value;
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

  const customerId = await createCustomer(input.customerName, input.customerEmail, input.cpfCnpj);

  const payload = {
    customer: customerId,
    billingType: input.billingType ?? 'UNDEFINED',
    ...(input.installments && input.installments > 1 && input.billingType === 'CREDIT_CARD'
      ? { totalValue: input.amount, installmentCount: input.installments }
      : { value: input.amount }),
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
  paymentIds: string[];
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

  let payments: ProviderPayment[];

  if (by === 'externalReference') {
    const list = (await asaasFetch(`/payments?externalReference=${encodeURIComponent(idOrRef)}&limit=100`, {
      method: 'GET',
    })) as { data?: ProviderPayment[]; hasMore?: boolean };
    if (list.hasMore) throw new Error('Número inesperado de cobranças para o pedido.');
    payments = list.data ?? [];
  } else {
    const payment = (await asaasFetch(`/payments/${encodeURIComponent(idOrRef)}`, {
      method: 'GET',
    })) as ProviderPayment;
    payments = [payment];
  }

  return summarizePayments(payments);
}
