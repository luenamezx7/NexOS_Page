'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { QrCode, CreditCard, Wallet, ExternalLink, Loader2, Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { bulkUnitPrice } from '@/lib/bulk-pricing';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_TRIES = 60; // ~5 min

type PixState = 'idle' | 'generating' | 'pending' | 'error';

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
// NexOS — Checkout Asaas (PIX / boleto / cartão)
// idle → generating (POST /api/checkout) → pending
// (link externo invoiceUrl + polling de /api/checkout/status a cada 5s) → success.
// O cliente escolhe o método no checkout do Asaas (invoiceUrl).
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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollExpired, setPollExpired] = useState(false);
  const triesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  const amountLabel = `R$ ${(bulkUnitPrice(productPrice, quantity, productId ?? undefined) * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const verifyPayment = useCallback(
    async (id: string): Promise<boolean> => {
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
      } catch {
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      triesRef.current = 0;
      setPollExpired(false);
      timerRef.current = setInterval(async () => {
        triesRef.current += 1;
        if (triesRef.current >= POLL_MAX_TRIES) {
          stopPolling();
          setPollExpired(true);
          return;
        }
        const paid = await verifyPayment(id);
        if (paid) {
          stopPolling();
          onSuccess();
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, verifyPayment, onSuccess],
  );

  const handleGenerate = useCallback(async () => {
    const nErr = validateNameField(name);
    const eErr = validateEmailField(email);
    const cErr = validateCpfField(cpfCnpj);
    onNameError(nErr);
    onEmailError(eErr);
    onCpfError(cErr);
    setFatal(null);
    if (nErr || eErr || cErr || !productId) {
      const target = document.getElementById(cErr ? 'checkout-cpf' : nErr ? 'checkout-name' : 'checkout-email');
      target?.focus({ preventScroll: false });
      return;
    }
    setState('generating');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, name: name.trim(), email: email.trim(), cpfCnpj: cpfCnpj.trim(), quantity }),
        signal: AbortSignal.timeout(25000),
      });
      const body: { paymentUrl?: string; paymentId?: string; externalReference?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.paymentUrl || !body.paymentId) {
        throw new Error(body.error ?? 'Falha ao gerar cobrança.');
      }
      setPaymentUrl(body.paymentUrl);
      setPaymentId(body.paymentId);
      setExternalReference(body.externalReference ?? null);
      setState('pending');
      startPolling(body.paymentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar cobrança.';
      setFatal(msg);
      setState('error');
    }
  }, [name, email, cpfCnpj, productId, quantity, onNameError, onEmailError, onCpfError, startPolling]);

  const handleManualCheck = useCallback(async () => {
    if (!paymentId || checking) return;
    setChecking(true);
    try {
      const paid = await verifyPayment(paymentId);
      if (paid) {
        stopPolling();
        onSuccess();
      }
    } finally {
      setChecking(false);
    }
  }, [paymentId, checking, verifyPayment, stopPolling, onSuccess]);

  const handleCopyLink = useCallback(async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = paymentUrl;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* silencioso */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [paymentUrl]);

  const handleReset = useCallback(() => {
    stopPolling();
    setPaymentUrl(null);
    setPaymentId(null);
    setExternalReference(null);
    setFatal(null);
    setPollExpired(false);
    setState('idle');
  }, [stopPolling]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
          Seus dados para o pagamento *
        </p>
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
          Usados para gerar a cobrança e enviar o recibo. Confira nos campos acima.
        </p>
        {(nameError || emailError || cpfError) && (
          <p className="text-xs text-red-500" role="alert">
            {cpfError ?? nameError ?? emailError}
          </p>
        )}
      </div>

      {state === 'pending' && paymentUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: FLUID_EASE }}
          className={`rounded-xl border p-5 text-center ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}
          aria-live="polite"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#ff2e6a]/30 bg-[#ff2e6a]/10 text-[#ff2e6a]" aria-hidden="true">
            <QrCode size={24} strokeWidth={2} />
          </div>
          <p className={`mt-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>
            Cobrança de {amountLabel} pronta
          </p>
          <p className={`mx-auto mt-1 max-w-sm text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
            Escolha como pagar no checkout seguro do Asaas: Pix com QR na hora, boleto ou cartão em até 12x. A confirmação chega sozinha.
          </p>
          {externalReference && (
            <p className={`mt-2 font-mono text-[10px] ${isDark ? 'text-white/30' : 'text-ink/30'}`}>Ref: {externalReference}</p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-nex w-full justify-center py-3.5 text-sm font-semibold"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
                Pagar no Asaas
              </span>
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${isDark ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white' : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink'}`}
                aria-live="polite"
              >
                {copied ? <Check size={14} strokeWidth={2.5} aria-hidden="true" className="text-[#28c840]" /> : <Copy size={14} strokeWidth={2} aria-hidden="true" />}
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checking}
                className="btn-secondary-nex flex-1 !py-2.5 !text-xs disabled:cursor-wait disabled:opacity-60"
              >
                {checking ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />}
                {checking ? 'Verificando…' : 'Já paguei, verificar'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className={`text-xs underline underline-offset-4 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-ink/40 hover:text-ink/70'}`}
            >
              Cancelar e gerar nova cobrança
            </button>
          </div>
          <p className={`mt-4 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
            {pollExpired ? (
              <span className="normal-case tracking-normal text-xs" role="status">
                Não detectamos o pagamento ainda. Se já pagou, clique em “Já paguei, verificar” ou aguarde alguns segundos.
              </span>
            ) : (
              <motion.span
                animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="inline-flex items-center gap-1.5"
              >
                <Loader2 size={12} className="animate-spin text-[#ff2e6a]" aria-hidden="true" />
                Aguardando pagamento…
              </motion.span>
            )}
          </p>
        </motion.div>
      ) : (
        <>
          <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}>
            <p className={`flex items-start gap-2.5 text-[13px] leading-relaxed ${isDark ? 'text-white/65' : 'text-ink/65'}`}>
              <QrCode size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-[#ff2e6a]" aria-hidden="true" />
              Geramos uma cobrança de <span className={`font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{amountLabel}</span> no Asaas — escolha o método no checkout.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Métodos aceitos">
              {[
                { icon: <QrCode size={12} strokeWidth={2} aria-hidden="true" />, label: 'Pix' },
                { icon: <CreditCard size={12} strokeWidth={2} aria-hidden="true" />, label: 'Cartão até 12x' },
                { icon: <Wallet size={12} strokeWidth={2} aria-hidden="true" />, label: 'Boleto' },
              ].map((m) => (
                <span
                  key={m.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${isDark ? 'border-white/10 bg-white/[0.04] text-white/60' : 'border-ink/10 bg-ink/[0.03] text-ink/60'}`}
                >
                  {m.icon}
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {state === 'error' && fatal && (
            <p className="text-xs text-red-500" role="alert">
              {fatal}
            </p>
          )}

          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={state === 'generating' || !productId}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: FLUID_EASE }}
            className="btn-primary-nex relative w-full justify-center overflow-hidden py-3.5 text-sm font-semibold tracking-wide disabled:cursor-wait disabled:opacity-60"
            aria-live="polite"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {state === 'generating' ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  Gerando cobrança…
                </>
              ) : (
                <>
                  <QrCode size={16} strokeWidth={2} aria-hidden="true" />
                  Pagar {amountLabel}
                </>
              )}
            </span>
          </motion.button>
        </>
      )}

      <p className={`flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        Asaas · Pix, boleto e cartão · sem dados salvos
      </p>
    </div>
  );
}

export default AsaasCheckoutPane;
