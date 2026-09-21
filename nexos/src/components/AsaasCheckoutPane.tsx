'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { QrCode, CreditCard, Receipt, ExternalLink, Loader2, Check, Copy, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { bulkUnitPrice } from '@/lib/bulk-pricing';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_TRIES = 60;

type PixState = 'idle' | 'generating' | 'pending' | 'error';
type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

interface AsaasCheckoutPaneProps {
  productId: string | null;
  productPrice: number;
  quantity?: number;
  name: string;
  email: string;
  cpfCnpj: string;
  onNameError: (msg: string | null) => void;
  onEmailError: (msg: string | null) => void;
  onCpfError: (msg: string | null) => void;
  nameError: string | null;
  emailError: string | null;
  cpfError: string | null;
  onSuccess: () => void;
}

function validateNameField(v: string): string | null {
  if (!v.trim()) return 'Nome completo é obrigatório';
  if (v.trim().length < 3) return 'Informe seu nome completo';
  return null;
}
function validateEmailField(v: string): string | null {
  if (!v.trim()) return 'E-mail é obrigatório para o recibo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido';
  return null;
}
function validateCpfField(v: string): string | null {
  const d = v.replace(/\D/g, '');
  if (!d) return 'CPF/CNPJ é obrigatório';
  if (d.length !== 11 && d.length !== 14) return 'CPF 11 dígitos ou CNPJ 14';
  return null;
}

// ============================================================
// NexOS — Checkout Asaas TRANSPARENTE single-page embutido
// Página única: seletor método + parcelas (cartão) + geração
// + iframe Asaas (cartão/boleto) — backend NUNCA vê cartão cru.
// PIX desabilitado com "Em desenvolvimento..." até Asaas liberar.
// ============================================================

export function AsaasCheckoutPane({
  productId,
  productPrice,
  quantity = 1,
  name,
  email,
  cpfCnpj,
  onNameError,
  onEmailError,
  onCpfError,
  nameError,
  emailError,
  cpfError,
  onSuccess,
}: AsaasCheckoutPaneProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [state, setState] = useState<PixState>('idle');
  const [fatal, setFatal] = useState<string | null>(null);
  const [billingType, setBillingType] = useState<BillingType>('CREDIT_CARD');
  const [installments, setInstallments] = useState<number>(1);
  const [installOptions, setInstallOptions] = useState<Array<{ installment: number; value: number; total: number }>>([]);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [bankSlipUrl, setBankSlipUrl] = useState<string | null>(null);
  const [identificationField, setIdentificationField] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pollExpired, setPollExpired] = useState(false);
  const triesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  const amount = bulkUnitPrice(productPrice, quantity, productId ?? undefined) * quantity;
  const amountLabel = `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Busca parcelas como Asaas mostraria (para cartão)
  useEffect(() => {
    if (!productId || billingType !== 'CREDIT_CARD') return;
    let cancelled = false;
    fetch(`/api/checkout/installments?productId=${encodeURIComponent(productId)}&quantity=${quantity}`, { signal: AbortSignal.timeout(10000) })
      .then((r) => r.json())
      .then((j: { installments?: typeof installOptions }) => {
        if (!cancelled && Array.isArray(j.installments)) setInstallOptions(j.installments);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productId, quantity, billingType]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  const verifyPayment = useCallback(async (id: string): Promise<boolean> => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    try {
      const res = await fetch('/api/checkout/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id }),
        signal: AbortSignal.timeout(20000),
      });
      const body: { paid?: boolean } = await res.json().catch(() => ({}));
      return res.ok && body.paid === true;
    } catch { return false; } finally { inFlightRef.current = false; }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    triesRef.current = 0;
    setPollExpired(false);
    const tick = async () => {
      if (document.visibilityState === 'hidden') { timerRef.current = setTimeout(tick, POLL_INTERVAL_MS) as never; return; }
      triesRef.current += 1;
      if (triesRef.current >= POLL_MAX_TRIES) { stopPolling(); setPollExpired(true); return; }
      const paid = await verifyPayment(id);
      if (paid) { stopPolling(); onSuccess(); return; }
      const delay = triesRef.current < 10 ? 3000 : POLL_INTERVAL_MS;
      timerRef.current = setTimeout(tick, delay) as never;
    };
    timerRef.current = setTimeout(tick, 3000) as never;
  }, [stopPolling, verifyPayment, onSuccess]);

  const handleGenerate = useCallback(async () => {
    const nErr = validateNameField(name);
    const eErr = validateEmailField(email);
    const cErr = validateCpfField(cpfCnpj);
    onNameError(nErr); onEmailError(eErr); onCpfError(cErr);
    setFatal(null);
    if (nErr || eErr || cErr || !productId) {
      const target = document.getElementById(cErr ? 'checkout-cpf' : nErr ? 'checkout-name' : 'checkout-email');
      target?.focus({ preventScroll: false });
      return;
    }
    if (billingType === 'PIX') { setFatal('Pix em desenvolvimento — liberação pendente no Asaas.'); return; }
    setState('generating');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId, name: name.trim(), email: email.trim(), cpfCnpj: cpfCnpj.trim(),
          billingType, installments, quantity,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const body: { paymentUrl?: string; paymentId?: string; externalReference?: string; bankSlipUrl?: string; identificationField?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.paymentUrl || !body.paymentId) throw new Error(body.error ?? 'Falha ao gerar cobrança.');
      setPaymentUrl(body.paymentUrl);
      setPaymentId(body.paymentId);
      setExternalReference(body.externalReference ?? null);
      setBankSlipUrl(body.bankSlipUrl ?? null);
      setIdentificationField(body.identificationField ?? null);
      setState('pending');
      startPolling(body.paymentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar cobrança.';
      setFatal(msg); setState('error');
    }
  }, [name, email, cpfCnpj, productId, quantity, billingType, installments, onNameError, onEmailError, onCpfError, startPolling]);

  const handleManualCheck = useCallback(async () => {
    if (!paymentId || checking) return;
    setChecking(true);
    try { const paid = await verifyPayment(paymentId); if (paid) { stopPolling(); onSuccess(); } } finally { setChecking(false); }
  }, [paymentId, checking, verifyPayment, stopPolling, onSuccess]);

  const handleCopy = useCallback(async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {} document.body.removeChild(ta);
    }
    setCopied(key); window.setTimeout(() => setCopied(null), 1800);
  }, []);

  const handleReset = useCallback(() => {
    stopPolling(); setPaymentUrl(null); setPaymentId(null); setBankSlipUrl(null); setIdentificationField(null); setExternalReference(null); setFatal(null); setPollExpired(false); setState('idle');
  }, [stopPolling]);

  return (
    <div className="flex flex-col gap-5">
      {/* Seletor de método — página única */}
      <div className="flex flex-col gap-2">
        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>Método de pagamento *</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'PIX' as const, label: 'Pix', icon: <QrCode size={16} strokeWidth={2} />, disabled: true, badge: 'Em desenvolvimento...' },
            { id: 'BOLETO' as const, label: 'Boleto', icon: <Receipt size={16} strokeWidth={2} />, disabled: false },
            { id: 'CREDIT_CARD' as const, label: 'Cartão', icon: <CreditCard size={16} strokeWidth={2} />, disabled: false },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={m.disabled}
              onClick={() => !m.disabled && setBillingType(m.id)}
              aria-pressed={billingType === m.id}
              aria-disabled={m.disabled}
              title={m.badge ?? m.label}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5c8a]/60
                ${m.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${billingType === m.id && !m.disabled ? 'border-[#ff5c8a]/40 bg-[#ff5c8a]/10 text-[#ff5c8a]' : isDark ? 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10' : 'border-ink/10 bg-ink/[0.03] text-ink/60 hover:bg-ink/10'}`}
            >
              {m.icon}
              {m.label}
              {m.badge && <span className="text-center font-mono text-[8px] leading-tight tracking-wide opacity-70">{m.badge}</span>}
            </button>
          ))}
        </div>
        {billingType === 'PIX' && (
          <p className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}><Info size={14} /> Pix será liberado automaticamente quando o Asaas aprovar sua conta (sem código).</p>
        )}
      </div>

      {/* Parcelas — só para cartão, como no redirect Asaas */}
      {billingType === 'CREDIT_CARD' && installOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <label htmlFor="checkout-installments" className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>Parcelas *</label>
          <select
            id="checkout-installments"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="field-input !py-3"
          >
            {installOptions.map((o) => (
              <option key={o.installment} value={o.installment}>
                {o.installment}x de R$ {o.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {o.installment === 1 ? 'à vista' : `— total R$ ${o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </option>
            ))}
          </select>
          <p className={`text-[11px] ${isDark ? 'text-white/35' : 'text-ink/35'}`}>Parcelamento exibido como no checkout Asaas. Juros oficiais aplicados pelo Asaas.</p>
        </div>
      )}

      {/* Estado pending — iframe embutido transparente */}
      {state === 'pending' && paymentUrl ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: FLUID_EASE }} className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`} aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#ff5c8a]/30 bg-[#ff5c8a]/10 text-[#ff5c8a]"><ShieldCheck size={16} /></span>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>Cobrança {amountLabel} — {billingType === 'BOLETO' ? 'Boleto' : 'Cartão'}</p>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-ink/50'}`}>{installments > 1 ? `${installments}x` : 'à vista'}</p>
            </div>
          </div>

          {externalReference && <p className={`mt-2 font-mono text-[10px] ${isDark ? 'text-white/30' : 'text-ink/30'}`}>Ref: {externalReference}</p>}

          {/* Boleto: linha digitável + link (iframe bloqueado por X-Frame-Options SAMEORIGIN) */}
          {billingType === 'BOLETO' && (
            <div className="mt-4 flex flex-col gap-2">
              {identificationField && (
                <div className={`flex items-center gap-2 rounded-lg border p-2.5 ${isDark ? 'border-white/10 bg-black/20' : 'border-ink/10 bg-white'}`}>
                  <code className="flex-1 break-all text-xs tracking-wide">{identificationField}</code>
                  <button type="button" onClick={() => handleCopy(identificationField, 'linha')} className="btn-secondary-nex !px-3 !py-1.5 !text-xs">
                    {copied === 'linha' ? <Check size={12} /> : <Copy size={12} />}{copied === 'linha' ? 'Copiado' : 'Copiar linha'}
                  </button>
                </div>
              )}
              <a
                href={bankSlipUrl ?? paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-nex w-full justify-center py-3.5 text-sm font-semibold"
              >
                <ExternalLink size={16} /> Abrir boleto (PDF)
              </a>
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className={`text-center text-xs underline underline-offset-4 ${isDark ? 'text-white/50 hover:text-white' : 'text-ink/50 hover:text-ink'}`}>
                Abrir checkout completo em nova aba
              </a>
            </div>
          )}

          {/* Cartão: checkout hospedado Asaas (iframe bloqueado por SAMEORIGIN) — abre em nova aba */}
          {billingType === 'CREDIT_CARD' && (
            <div className="mt-4 flex flex-col gap-2">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn-primary-nex w-full justify-center py-3.5 text-sm font-semibold">
                <ExternalLink size={16} /> Pagar com cartão no Asaas
              </a>
              <p className={`text-center text-[11px] ${isDark ? 'text-white/35' : 'text-ink/35'}`}>Checkout seguro hospedado pelo Asaas em nova aba — seu servidor não recebe dados de cartão.</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => paymentUrl && handleCopy(paymentUrl, 'link')} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10' : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10'}`}>
              {copied === 'link' ? <Check size={14} className="text-[#28c840]" /> : <Copy size={14} />}{copied === 'link' ? 'Link copiado' : 'Copiar link'}
            </button>
            <button type="button" onClick={handleManualCheck} disabled={checking} className="btn-secondary-nex flex-1 !py-2.5 !text-xs disabled:opacity-60">
              {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}{checking ? 'Verificando…' : 'Já paguei'}
            </button>
          </div>
          <button type="button" onClick={handleReset} className={`mt-2 w-full text-xs underline underline-offset-4 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-ink/40 hover:text-ink/70'}`}>Gerar nova cobrança</button>
          <p className={`mt-3 flex justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
            {pollExpired ? <span className="normal-case tracking-normal text-xs">Não detectamos pagamento — clique em “Já paguei”</span> : <motion.span animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin text-[#ff5c8a]" /> Aguardando pagamento…</motion.span>}
          </p>
          <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary-nex mt-3 w-full !py-2.5 text-xs justify-center gap-1.5"><ExternalLink size={12} /> Abrir checkout em nova aba (fallback)</a>
        </motion.div>
      ) : (
        <>
          <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}>
            <p className={`flex items-start gap-2.5 text-[13px] leading-relaxed ${isDark ? 'text-white/65' : 'text-ink/65'}`}>
              {billingType === 'BOLETO' ? <Receipt size={18} className="mt-0.5 shrink-0 text-[#ff5c8a]" /> : billingType === 'CREDIT_CARD' ? <CreditCard size={18} className="mt-0.5 shrink-0 text-[#ff5c8a]" /> : <QrCode size={18} className="mt-0.5 shrink-0 text-[#ff5c8a]" />}
              Geramos cobrança de <span className={`font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{amountLabel}</span> {billingType === 'BOLETO' ? 'em boleto (linha + PDF embutido)' : billingType === 'CREDIT_CARD' && installments > 1 ? `em ${installments}x no cartão` : 'no Asaas'} — CPF junto ao pagamento, confirmação automática.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${isDark ? 'border-white/10 bg-white/[0.04] text-white/60' : 'border-ink/10 bg-ink/[0.03] text-ink/60'}`}>{billingType === 'BOLETO' ? 'Boleto' : billingType === 'CREDIT_CARD' ? `Cartão ${installments}x` : 'Pix em breve'}</span>
            </div>
          </div>
          {state === 'error' && fatal && <p className="text-xs text-red-500" role="alert">{fatal}</p>}
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={state === 'generating' || !productId}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: FLUID_EASE }}
            className="btn-primary-nex w-full justify-center py-3.5 text-sm font-semibold disabled:opacity-60"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-2">
              {state === 'generating' ? <><Loader2 size={18} className="animate-spin" /> Gerando {billingType === 'BOLETO' ? 'boleto' : 'checkout'}…</> : <><CreditCard size={16} /> Pagar {amountLabel}{billingType === 'CREDIT_CARD' && installments > 1 ? ` em ${installments}x` : ''}</>}
            </span>
          </motion.button>

        </>
      )}
    </div>
  );
}

export default AsaasCheckoutPane;
