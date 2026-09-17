'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, ShieldCheck, Lock, Loader2, Check, AlertCircle } from 'lucide-react';
import { config } from '@/config';
import { useTheme } from './ThemeProvider';

// ============================================================
// NexOS — Embedded Checkout Transparente (Dual Theme)
// PCI-DSS: nunca acessa PAN/CVV. Tudo via Stripe Elements (iFrame isolado).
// Adapta 100% ao tema claro/escuro via Appearance API + Glassmorphism.
// ============================================================

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ——— Appearance DARK ———
const APPEARANCE_DARK = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#ff2e6a',
    colorBackground: '#050505',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.55)',
    colorDanger: '#ef4444',
    fontFamily: 'Geist, "Space Grotesk", system-ui, -apple-system, sans-serif',
    fontSizeBase: '15px',
    spacingUnit: '4px',
    borderRadius: '8px',
    colorIcon: 'rgba(255,255,255,0.65)',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: 'none',
      color: '#ffffff',
      fontFamily: 'Geist, system-ui, sans-serif',
      padding: '12px 14px',
    },
    '.Input:focus': {
      backgroundColor: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,46,106,0.55)',
      boxShadow: '0 0 0 3px rgba(255,46,106,0.18)',
    },
    '.Input--invalid': {
      border: '1px solid rgba(239,68,68,0.6)',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.15)',
    },
    '.Label': {
      color: 'rgba(255,255,255,0.55)',
      fontFamily: 'Geist Mono, monospace',
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      marginBottom: '8px',
    },
    '.Tab': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: 'rgba(255,255,255,0.70)',
    },
    '.Tab:hover': {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderColor: 'rgba(255,255,255,0.14)',
      color: '#ffffff',
    },
    '.Tab--selected': {
      backgroundColor: 'rgba(255,46,106,0.12)',
      borderColor: 'rgba(255,46,106,0.45)',
      color: '#ffffff',
      boxShadow: '0 0 0 2px rgba(255,46,106,0.15)',
    },
    '.Tab--selected:hover': {
      backgroundColor: 'rgba(255,46,106,0.16)',
      borderColor: 'rgba(255,46,106,0.55)',
    },
    '.Block': { backgroundColor: 'transparent' },
  },
} as const;

// ——— Appearance LIGHT ———
const APPEARANCE_LIGHT = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#db2777',
    colorBackground: '#ffffff',
    colorText: '#131316',
    colorTextSecondary: 'rgba(19,19,22,0.55)',
    colorDanger: '#dc2626',
    fontFamily: 'Geist, "Space Grotesk", system-ui, -apple-system, sans-serif',
    fontSizeBase: '15px',
    spacingUnit: '4px',
    borderRadius: '8px',
    colorIcon: 'rgba(19,19,22,0.45)',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(19,19,22,0.04)',
      border: '1px solid rgba(19,19,22,0.10)',
      boxShadow: 'none',
      color: '#131316',
      fontFamily: 'Geist, system-ui, sans-serif',
      padding: '12px 14px',
    },
    '.Input:focus': {
      backgroundColor: '#ffffff',
      border: '1px solid rgba(219,39,119,0.45)',
      boxShadow: '0 0 0 3px rgba(219,39,119,0.14)',
    },
    '.Input--invalid': {
      border: '1px solid rgba(220,38,38,0.55)',
      boxShadow: '0 0 0 3px rgba(220,38,38,0.12)',
    },
    '.Label': {
      color: 'rgba(19,19,22,0.55)',
      fontFamily: 'Geist Mono, monospace',
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      marginBottom: '8px',
    },
    '.Tab': {
      backgroundColor: 'rgba(19,19,22,0.04)',
      border: '1px solid rgba(19,19,22,0.10)',
      color: 'rgba(19,19,22,0.70)',
    },
    '.Tab:hover': {
      backgroundColor: 'rgba(19,19,22,0.06)',
      borderColor: 'rgba(19,19,22,0.14)',
      color: '#131316',
    },
    '.Tab--selected': {
      backgroundColor: 'rgba(219,39,119,0.08)',
      borderColor: 'rgba(219,39,119,0.35)',
      color: '#131316',
      boxShadow: '0 0 0 2px rgba(219,39,119,0.12)',
    },
    '.Tab--selected:hover': {
      backgroundColor: 'rgba(219,39,119,0.12)',
      borderColor: 'rgba(219,39,119,0.45)',
    },
    '.Block': { backgroundColor: 'transparent' },
  },
} as const;

interface EmbeddedCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  priceId: string | null;
  productTitle: string;
  productPrice: number;
}

type DrawerState = 'idle' | 'loading' | 'ready' | 'processing' | 'success' | 'error';

function CheckoutForm({
  onSuccess,
  onError,
  amountLabel,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  amountLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const [processing, setProcessing] = useState<boolean>(false);
  const [formReady, setFormReady] = useState<boolean>(false);

  const handlePay = useCallback(async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/sucesso` },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message ?? 'Falha ao processar pagamento. Verifique os dados.');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
        return;
      }

      if (paymentIntent && ['processing', 'requires_capture'].includes(paymentIntent.status)) {
        onSuccess();
        return;
      }

      onError('Pagamento não concluído. Tente novamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      onError(msg);
    } finally {
      setProcessing(false);
    }
  }, [stripe, elements, onSuccess, onError]);

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}>
        <PaymentElement
          onReady={() => setFormReady(true)}
          onLoaderStart={() => setFormReady(false)}
          options={{ layout: 'tabs', fields: { billingDetails: 'auto' } }}
        />
        {!formReady && (
          <div className={`mt-4 flex items-center gap-3 text-sm ${isDark ? 'text-white/50' : 'text-ink/50'}`} aria-live="polite">
            <Loader2 size={16} className="animate-spin text-[#ff2e6a]" aria-hidden="true" />
            <span>Carregando campos seguros…</span>
          </div>
        )}
      </div>

      <motion.button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements || processing || !formReady}
        whileHover={reduce ? undefined : { scale: processing ? 1 : 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.3, ease: FLUID_EASE }}
        className="btn-primary-nex relative w-full justify-center overflow-hidden py-3.5 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
        aria-live="polite"
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {processing ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              Processando…
            </>
          ) : (
            <>
              <Lock size={16} strokeWidth={2} aria-hidden="true" />
              Pagar {amountLabel}
            </>
          )}
        </span>
        <span className="shimmer-sweep" aria-hidden="true" />
      </motion.button>

      <p className={`flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        Pagamento seguro • PCI-DSS via Stripe • Seus dados não tocam nossos servidores
      </p>
    </div>
  );
}

export function EmbeddedCheckoutDrawer({ open, onClose, priceId, productTitle, productPrice }: EmbeddedCheckoutDrawerProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !priceId) return;
    let cancelled = false;
    setDrawerState('loading');
    setErrorMsg(null);
    setClientSecret(null);

    (async () => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });
        const body: { clientSecret?: string; error?: string } = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !body.clientSecret) throw new Error(body.error ?? 'Falha ao inicializar checkout.');
        setClientSecret(body.clientSecret);
        setDrawerState('ready');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Erro ao carregar checkout.';
        setErrorMsg(msg);
        setDrawerState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, priceId]);

  const handleClose = useCallback(() => {
    setClientSecret(null);
    setDrawerState('idle');
    setErrorMsg(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  const amountLabel = `R$ ${productPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const appearance = isDark ? APPEARANCE_DARK : APPEARANCE_LIGHT;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: FLUID_EASE }}
            className={`fixed inset-0 z-[70] backdrop-blur-[8px] ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="embedded-checkout-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.45, ease: FLUID_EASE }}
            className={`fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] border shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-[20px] will-change-transform md:inset-0 md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:mx-0 md:max-h-[88dvh] md:w-[480px] md:-translate-y-1/2 md:rounded-3xl ${
              isDark ? 'border-white/10 bg-[#0a0a0a]/90' : 'border-ink/10 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.18)]'
            }`}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-white/15' : 'via-ink/10'}`} aria-hidden="true" />
            <div className={`pointer-events-none absolute inset-0 rounded-t-[24px] md:rounded-3xl ${isDark ? 'bg-gradient-to-b from-white/[0.07] to-transparent' : 'bg-gradient-to-b from-ink/[0.03] to-transparent'}`} aria-hidden="true" />

            <div className={`relative flex items-start justify-between gap-4 border-b px-6 py-5 md:px-7 ${isDark ? 'border-white/10' : 'border-ink/10'}`}>
              <div className="min-w-0">
                <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}>Checkout seguro</p>
                <h2 id="embedded-checkout-title" className={`mt-1 truncate font-display text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                  {drawerState === 'success' ? 'Pagamento confirmado' : productTitle}
                </h2>
                {drawerState !== 'success' && (
                  <p className={`mt-1 font-mono text-xs ${isDark ? 'text-white/50' : 'text-ink/55'}`}>
                    {amountLabel} • parcela única • sem dados salvos
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar checkout"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 ${
                  isDark ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/30' : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink focus-visible:ring-ink/20'
                }`}
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 py-6 md:px-7 md:py-7">
              {drawerState === 'loading' && (
                <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
                  <div className="space-y-3">
                    <div className={`h-12 animate-pulse rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'}`} />
                    <div className={`h-12 animate-pulse rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'}`} />
                    <div className={`h-[88px] animate-pulse rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'}`} />
                  </div>
                  <div className={`flex items-center justify-center gap-2 py-4 text-sm ${isDark ? 'text-white/45' : 'text-ink/50'}`}>
                    <Loader2 size={18} className="animate-spin text-[#ff2e6a]" aria-hidden="true" />
                    Inicializando pagamento seguro…
                  </div>
                </div>
              )}

              {drawerState === 'error' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-500/20 bg-red-500/[0.08] p-5 text-sm leading-relaxed text-red-600 dark:text-red-200" role="alert">
                  <span className="flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
                    Não foi possível iniciar o pagamento
                  </span>
                  <p className="mt-2 opacity-80">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerState('loading');
                      setErrorMsg(null);
                      fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId }) })
                        .then((r) => r.json())
                        .then((b: { clientSecret?: string; error?: string }) => {
                          if (b.clientSecret) {
                            setClientSecret(b.clientSecret);
                            setDrawerState('ready');
                          } else throw new Error(b.error ?? 'Falha');
                        })
                        .catch((e: unknown) => {
                          const m = e instanceof Error ? e.message : 'Erro';
                          setErrorMsg(m);
                          setDrawerState('error');
                        });
                    }}
                    className={`mt-4 inline-flex rounded-lg border px-4 py-2 text-xs font-semibold transition ${isDark ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/10' : 'border-ink/10 bg-ink/[0.04] text-ink hover:bg-ink/10'}`}
                  >
                    Tentar novamente
                  </button>
                </motion.div>
              )}

              {drawerState === 'ready' && clientSecret && (
                <Elements key={`${theme}-${clientSecret.slice(-8)}`} stripe={stripePromise} options={{ clientSecret, appearance, locale: 'pt-BR' }}>
                  <CheckoutForm amountLabel={amountLabel} onSuccess={() => setDrawerState('success')} onError={(msg) => { setErrorMsg(msg); setDrawerState('error'); }} />
                </Elements>
              )}

              {drawerState === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: FLUID_EASE }} className="flex flex-col items-center gap-5 py-8 text-center" role="status" aria-live="polite">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-[#ff2e6a]/30 bg-[#ff2e6a]/10 text-[#ff2e6a] shadow-[0_0_20px_rgba(255,46,106,0.25)]">
                    <Check size={28} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className={`font-display text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Pagamento aprovado</h3>
                    <p className={`mx-auto mt-2 max-w-sm text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-ink/60'}`}>
                      Recebemos seu pagamento de <span className={`font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{amountLabel}</span> para <span className={isDark ? 'text-white' : 'text-ink'}>{productTitle}</span>. Enviamos a confirmação por e-mail.
                    </p>
                  </div>
                  <a href={`https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`} target="_blank" rel="noopener noreferrer" className="btn-primary-nex">
                    Falar no WhatsApp
                    <span className="shimmer-sweep" aria-hidden="true" />
                  </a>
                  <button type="button" onClick={handleClose} className={`text-sm underline underline-offset-4 ${isDark ? 'text-white/50 hover:text-white/80' : 'text-ink/50 hover:text-ink/80'}`}>
                    Fechar
                  </button>
                </motion.div>
              )}
            </div>

            {drawerState !== 'success' && (
              <div className={`border-t px-6 py-4 md:px-7 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`}>
                <p className={`flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
                  <Lock size={12} strokeWidth={2} aria-hidden="true" />
                  Criptografia TLS • Stripe Elements • Nenhum dado salvo no navegador
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EmbeddedCheckoutDrawer;
