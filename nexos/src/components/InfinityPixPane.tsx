'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { QrCode, ExternalLink, Loader2, Check, Copy, RefreshCw, ShieldCheck, ReceiptText } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_TRIES = 60; // ~5 min

type PixState = 'idle' | 'generating' | 'pending' | 'error';

interface InfinityPixPaneProps {
  priceId: string | null;
  productPrice: number;
  name: string;
  email: string;
  onNameError: (msg: string | null) => void;
  onEmailError: (msg: string | null) => void;
  nameError: string | null;
  emailError: string | null;
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

// ============================================================
// NexOS — Pix via InfinitePay (taxa zero)
// idle → generating (POST /api/checkout/infinitepay) → pending
// (link externo + polling de /status a cada 5s) → success.
// O QR Code aparece no checkout da InfinitePay (nova aba).
// ============================================================

export function InfinityPixPane({
  priceId,
  productPrice,
  name,
  email,
  onNameError,
  onEmailError,
  nameError,
  emailError,
  onSuccess,
}: InfinityPixPaneProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [state, setState] = useState<PixState>('idle');
  const [fatal, setFatal] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderNsu, setOrderNsu] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualChecking, setManualChecking] = useState(false);
  const [manualResult, setManualResult] = useState<'paid' | 'pending' | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const triesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const [pollExpired, setPollExpired] = useState(false);

  const amountLabel = `R$ ${productPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const verifyPayment = useCallback(
    async (nsu: string): Promise<boolean> => {
      // Trava de sobreposição: com intervalo de 5s e rede lenta, ticks
      // acumulavam requests. Um por vez — sem isso, parecia "travado".
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      try {
        const res = await fetch('/api/checkout/infinitepay/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNsu: nsu }),
          // Timeout client-side: sem isso, servidor instável = espera infinita
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
    (nsu: string) => {
      stopPolling();
      triesRef.current = 0;
      setPollExpired(false);
      timerRef.current = setInterval(async () => {
        triesRef.current += 1;
        // Fim do polling com orientação (nunca espera "para sempre"):
        // se o usuário pagou OUTRA cobrança (ex.: manual no app),
        // este order_nsu nunca confirma — abre a verificação manual.
        if (triesRef.current >= POLL_MAX_TRIES) {
          stopPolling();
          setPollExpired(true);
          setManualOpen(true);
          return;
        }
        const paid = await verifyPayment(nsu);
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
    onNameError(nErr);
    onEmailError(eErr);
    setFatal(null);
    if (nErr || eErr || !priceId) {
      const target = document.getElementById(nErr ? 'checkout-name' : 'checkout-email');
      target?.focus({ preventScroll: false });
      return;
    }
    setState('generating');
    try {
      const res = await fetch('/api/checkout/infinitepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, name: name.trim(), email: email.trim() }),
        signal: AbortSignal.timeout(25000),
      });
      const body: { paymentUrl?: string; orderNsu?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.paymentUrl || !body.orderNsu) {
        throw new Error(body.error ?? 'Falha ao gerar Pix.');
      }
      setPaymentUrl(body.paymentUrl);
      setOrderNsu(body.orderNsu);
      setState('pending');
      startPolling(body.orderNsu);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar Pix.';
      setFatal(msg);
      setState('error');
    }
  }, [name, email, priceId, onNameError, onEmailError, startPolling]);

  const handleManualCheck = useCallback(async () => {
    if (!orderNsu || checking) return;
    setChecking(true);
    try {
      const paid = await verifyPayment(orderNsu);
      if (paid) {
        stopPolling();
        onSuccess();
      }
    } finally {
      setChecking(false);
    }
  }, [orderNsu, checking, verifyPayment, stopPolling, onSuccess]);

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
    setOrderNsu(null);
    setFatal(null);
    setPollExpired(false);
    setState('idle');
  }, [stopPolling]);

  // Cobrança criada manualmente no app InfinitePay: cola o link da
  // cobrança ou o order_nsu para conferir se já foi paga.
  const handleManualVerify = useCallback(async () => {
    const code = manualCode.trim();
    if (!code || manualChecking) return;
    setManualChecking(true);
    setManualError(null);
    setManualResult(null);
    try {
      const res = await fetch('/api/checkout/infinitepay/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(20000),
      });
      const body: { paid?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Não foi possível verificar.');
      setManualResult(body.paid === true ? 'paid' : 'pending');
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Falha ao verificar.');
    } finally {
      setManualChecking(false);
    }
  }, [manualCode, manualChecking]);

  return (
    <div className="flex flex-col gap-5">
      {/* Nome/e-mail compartilhados com a aba cartão — mesmo padrão inline */}
      <div className="flex flex-col gap-2">
        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
          Seus dados para o Pix *
        </p>
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
          Usados para gerar a cobrança e enviar o recibo. Confira nos campos acima.
        </p>
        {(nameError || emailError) && (
          <p className="text-xs text-red-500" role="alert">
            {nameError ?? emailError}
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
            Pix de {amountLabel} pronto
          </p>
          <p className={`mx-auto mt-1 max-w-sm text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
            Pague com o QR Code abaixo, sem sair do site (taxa zero). A confirmação chega sozinha em segundos.
          </p>
          {/* Checkout InfinitePay embutido. Se a InfinitePay bloquear iframe
              (anti-clickjacking), o quadro fica em branco — use a nova aba. */}
          <div
            data-lenis-prevent
            className={`relative mt-4 overflow-hidden rounded-xl border ${isDark ? 'border-white/10 bg-white' : 'border-ink/10 bg-white'}`}
          >
            <iframe
              src={paymentUrl}
              title={`Pagamento Pix de ${amountLabel} via InfinitePay`}
              loading="lazy"
              allow="payment *; clipboard-write"
              className="h-[54dvh] max-h-[560px] min-h-[360px] w-full border-0 bg-white"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-1.5 text-xs underline underline-offset-4 ${isDark ? 'text-white/50 hover:text-white/80' : 'text-ink/50 hover:text-ink/80'}`}
            >
              <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
              Quadro em branco? Abrir Pix em nova aba
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
              Cancelar e gerar novo Pix
            </button>
          </div>
          <p className={`mt-4 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
            {pollExpired ? (
              <span className="normal-case tracking-normal text-xs" role="status">
                Não detectamos o pagamento neste Pix. Pagou outra cobrança (ex.: manual no app)? Confira abaixo em “Verificar pagamento”.
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
              Geramos um Pix de <span className={`font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{amountLabel}</span> na InfinitePay — QR Code na hora, aqui no site, confirmação em segundos e taxa zero.
            </p>
          </div>

          {state === 'error' && fatal && (
            <p className="text-xs text-red-500" role="alert">
              {fatal}
            </p>
          )}

          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={state === 'generating' || !priceId}
            whileHover={reduce ? undefined : { scale: state === 'generating' ? 1 : 1.02 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.3, ease: FLUID_EASE }}
            className="btn-primary-nex relative w-full justify-center overflow-hidden py-3.5 text-sm font-semibold tracking-wide disabled:cursor-wait disabled:opacity-60"
            aria-live="polite"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {state === 'generating' ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  Gerando Pix…
                </>
              ) : (
                <>
                  <QrCode size={16} strokeWidth={2} aria-hidden="true" />
                  Gerar Pix de {amountLabel}
                </>
              )}
            </span>
            <span className="shimmer-sweep" aria-hidden="true" />
          </motion.button>
        </>
      )}

      <p className={`flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        Pix InfinitePay · taxa zero · sem dados salvos
      </p>

      {/* Cobrança manual (criada no app): verificação avulsa por link/order_nsu */}
      <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`}>
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          aria-expanded={manualOpen}
          className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2e6a]/60 rounded-xl"
        >
          <ReceiptText size={16} strokeWidth={2} className="shrink-0 text-[#ff2e6a]" aria-hidden="true" />
          <span className={`text-[13px] font-semibold ${isDark ? 'text-white/80' : 'text-ink/80'}`}>
            Criou a cobrança no app? Verificar pagamento
          </span>
        </button>
        {manualOpen && (
          <div className="flex flex-col gap-2.5 px-4 pb-4">
            <label htmlFor="pix-manual-code" className={`font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}>
              Link da cobrança ou order_nsu
            </label>
            <input
              id="pix-manual-code"
              type="text"
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setManualResult(null); setManualError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleManualVerify(); }}
              placeholder="https://checkout.infinitepay.com.br/… ou order_nsu"
              autoComplete="off"
              className="field-input !py-2.5 !text-[13px]"
            />
            <button
              type="button"
              onClick={handleManualVerify}
              disabled={manualChecking || !manualCode.trim()}
              className="btn-secondary-nex w-full !py-2.5 !text-xs disabled:cursor-wait disabled:opacity-60"
            >
              {manualChecking ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />}
              {manualChecking ? 'Consultando…' : 'Consultar status'}
            </button>
            {manualResult === 'paid' && (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28c840]" role="status">
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                Pagamento confirmado na InfinitePay.
              </p>
            )}
            {manualResult === 'pending' && (
              <p className={`text-xs ${isDark ? 'text-white/55' : 'text-ink/55'}`} role="status">
                Ainda não consta pagamento para essa cobrança. Se acabou de pagar, aguarde alguns segundos e consulte de novo.
              </p>
            )}
            {manualError && (
              <p className="text-xs text-red-500" role="alert">
                {manualError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InfinityPixPane;
