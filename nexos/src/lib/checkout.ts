import { BULK_MAX_QTY } from './bulk-pricing';

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
export interface PaymentCredentials { externalReference: string; statusToken: string }
export interface CheckoutPayment extends PaymentCredentials {
  paymentId: string;
  paymentUrl: string;
  amount: number; // cents, authoritative server response
  currency: 'brl';
  billingType: BillingType;
  installments: number;
  bankSlipUrl: string | null;
  identificationField: string | null;
}
export interface CheckoutOrderSnapshot {
  status: string;
  order: { productId: string; quantity: number; amount: number; status: string; externalReference: string } | null;
  payment: CheckoutPayment | null;
  credentials: PaymentCredentials | null;
}

export function checkoutQuantity(value: unknown): number {
  const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  return Number.isInteger(number) && number >= 1 && number <= BULK_MAX_QTY ? number : 1;
}
export function checkoutHref(productId: string, quantity = 1): string {
  return `/checkout?${new URLSearchParams({ product: productId, quantity: String(checkoutQuantity(quantity)) })}`;
}
export function checkoutLoginHref(productId: string, quantity = 1): string {
  return `/portal/acesso?${new URLSearchParams({ callbackUrl: checkoutHref(productId, quantity) })}`;
}
export function paymentSuccessHref(reference: string): string {
  return `/sucesso?${new URLSearchParams({ externalReference: reference })}`;
}
export function money(value: number): string { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits.length <= 11
    ? digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    : digits.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,4})/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
export function checkoutFieldErrors(name: string, email: string, cpfCnpj: string) {
  const digits = cpfCnpj.replace(/\D/g, '');
  return {
    name: name.trim().length < 3 || name.trim().length > 120 ? 'Informe seu nome completo, com até 120 caracteres.' : '',
    email: email.trim().length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Informe um e-mail válido para o recibo, com até 160 caracteres.' : '',
    cpfCnpj: digits.length !== 11 && digits.length !== 14 ? 'Informe um CPF com 11 dígitos ou CNPJ com 14.' : '',
  };
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function asaasPaymentUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (url.hostname === 'asaas.com' || url.hostname.endsWith('.asaas.com')) ? url.href : null;
  } catch { return null; }
}
export function parsePaymentCredentials(value: unknown): PaymentCredentials | null {
  return record(value) && typeof value.externalReference === 'string' && value.externalReference.length <= 36 && value.externalReference.startsWith('nexos-') && typeof value.statusToken === 'string' && value.statusToken.length >= 8 && value.statusToken.length <= 128
    ? { externalReference: value.externalReference, statusToken: value.statusToken } : null;
}
export function parseCheckoutPayment(value: unknown): CheckoutPayment | null {
  if (!record(value)) return null;
  const credentials = parsePaymentCredentials(value), paymentUrl = asaasPaymentUrl(value.paymentUrl);
  if (!credentials || !paymentUrl || typeof value.paymentId !== 'string' || value.paymentId.length > 40 || !value.paymentId || typeof value.amount !== 'number' || !Number.isSafeInteger(value.amount) || value.amount < 500 || value.currency !== 'brl') return null;
  if (!['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED'].includes(String(value.billingType))) return null;
  const installments = typeof value.installments === 'number' && Number.isInteger(value.installments) && value.installments >= 1 && value.installments <= 12 ? value.installments : 1;
  return { ...credentials, paymentId: value.paymentId, paymentUrl, amount: value.amount, currency: 'brl', billingType: value.billingType as BillingType, installments, bankSlipUrl: asaasPaymentUrl(value.bankSlipUrl), identificationField: typeof value.identificationField === 'string' && value.identificationField.length <= 250 ? value.identificationField : null };
}

/** Persist only opaque references. Payer name/email/document stay in component memory. */
export function attemptStorageKey(productId: string, quantity: number): string { return `nexos-checkout-attempt:${productId}:${quantity}`; }
export function createCheckoutAttempt(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function rememberPayment(payment: PaymentCredentials & { paymentId?: string }): void {
  try {
    const value = JSON.stringify({ externalReference: payment.externalReference, statusToken: payment.statusToken });
    sessionStorage.setItem(`nexos-payment:${payment.externalReference}`, value);
    if (payment.paymentId) sessionStorage.setItem(`nexos-payment:${payment.paymentId}`, value);
  } catch { /* The in-memory flow still works when browser storage is unavailable. */ }
}
