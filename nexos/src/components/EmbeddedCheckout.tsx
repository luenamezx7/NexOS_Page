'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutElementsProvider, useCheckoutElements, PaymentElement } from '@stripe/react-stripe-js/checkout';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, ShieldCheck, Lock, Loader2, Check, AlertCircle } from 'lucide-react';
import { config } from '@/config';
import { useTheme } from './ThemeProvider';

// ============================================================
// NexOS — Embedded Checkout Transparente (Checkout Sessions + Elements)
// Stripe recomenda Checkout Sessions (ui_mode custom) sobre PaymentIntents.
// - client_secret vem de POST /api/checkout (Checkout Session)
// - SDK é inicializado via CheckoutProvider (iFrame isolado, PCI-DSS)
// - Confirmação via checkout.confirm() — sem raw PAN no React
// Dual theme: dark/light via Appearance API + Glassmorphism adaptativo
// ============================================================

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

type DrawerState = 'idle' | 'loading' | 'ready' | 'success' | 'error';

// ——— Inner form que consome o Checkout SDK ———
function CheckoutFormInner({
  onSuccess,
  onError,
  amountLabel,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  amountLabel: string;
}) {
  const checkoutResult = useCheckoutElements();
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isLoading = checkoutResult.type === 'loading';
  const isError = checkoutResult.type === 'error';
  const checkout = checkoutResult.type === 'success' ? checkoutResult.checkout : null;

  // Timeout anti-loading infinito: se Stripe.js não carregar (pk faltando), mostra erro com instrução
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      if (checkoutResult.type === 'loading') {
        const hasPk = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder';
        onError(
          hasPk
            ? 'Checkout demorou para carregar. Verifique sua conexão ou tente novamente.'
            : 'Stripe publishable key não configurada no Vercel. Adicione NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY e faça Redeploy (NEXT_PUBLIC_ é injetado no build).'
        );
      }
    }, 9000);
    return () => clearTimeout(t);
  }, [isLoading, checkoutResult.type, onError]);

  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = useCallback((v: string) => {
    if (!v.trim()) {
      setEmailError('E-mail é obrigatório para o recibo');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailError('E-mail inválido');
      return false;
    }
    setEmailError(null);
    return true;
  }, []);

  const handlePay = useCallback(async () => {
    if (!checkout) return;
    if (!validateEmail(email)) return;
    setSubmitting(true);
    try {
      const result = await checkout.confirm({ email: email.trim() });

      if (result.type === 'error') {
        const msg = (result.error as { message?: string })?.message ?? 'Falha ao processar pagamento.';
        onError(msg);
        return;
      }

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [checkout, email, validateEmail, onSuccess, onError]);

  if (isError) {
    const msg = checkoutResult.type === 'error' ? checkoutResult.error.message : 'Falha ao carregar checkout.';
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm leading-relaxed text-red-600" role="alert">
        <p className="font-semibold">Falha ao carregar checkout</p>
        <p className="mt-1 text-xs opacity-80">{msg}</p>
        <p className="mt-2 text-xs opacity-60">Verifique se NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY está no Vercel e se fez Redeploy com Clear Cache.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="checkout-email" className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
          E-mail para recibo *
        </label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          onBlur={() => validateEmail(email)}
          placeholder="seu@email.com"
          autoComplete="email"
          required
          aria-invalid={emailError ? 'true' : 'false'}
          aria-describedby={emailError ? 'checkout-email-error' : undefined}
          className="field-input"
        />
        {emailError && (
          <p id="checkout-email-error" className="text-xs text-red-500" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}>
        {isLoading ? (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            <div className={`h-12 animate-pulse rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'}`} />
            <div className={`h-12 animate-pulse rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'}`} />
            <div className="flex items-center gap-2 py-2 text-sm opacity-60">
              <Loader2 size={16} className="animate-spin text-[#ff2e6a]" aria-hidden="true" />
              <span>Carregando checkout seguro…</span>
            </div>
          </div>
        ) : (
          <PaymentElement />
        )}
      </div>

      <motion.button
        type="button"
        onClick={handlePay}
        disabled={!checkout || submitting || isLoading}
        whileHover={reduce ? undefined : { scale: submitting ? 1 : 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.3, ease: FLUID_EASE }}
        className="btn-primary-nex relative w-full justify-center overflow-hidden py-3.5 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
        aria-live="polite"
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {submitting ? (
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
        Checkout Sessions • PCI-DSS via Stripe • Seus dados não tocam nossos servidores
      </p>
    </div>
  );
}

// Wrapper que isola o CheckoutElementsProvider — unmount limpa memória do SDK
function CheckoutProviderWrapper({
  clientSecret,
  onSuccess,
  onError,
  amountLabel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  amountLabel: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const appearance = isDark ? APPEARANCE_DARK : APPEARANCE_LIGHT;

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        elementsOptions: {
          appearance: appearance as unknown as Record<string, unknown>,
        },
      }}
    >
      <CheckoutFormInner onSuccess={onSuccess} onError={onError} amountLabel={amountLabel} />
    </CheckoutElementsProvider>
  );
}

export function EmbeddedCheckoutDrawer({ open, onClose, priceId, productTitle, productPrice }: EmbeddedCheckoutDrawerProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !priceId) return;
    let cancelled = false;
    setDrawerState('loading');
    setErrorMsg(null);
    setClientSecret(null);
    setProductImage(null);

    (async () => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });
        const body: { clientSecret?: string; error?: string; details?: unknown; productImage?: string | null } = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !body.clientSecret) {
          const details = typeof body.details === 'string' ? body.details : body.details ? JSON.stringify(body.details) : '';
          throw new Error(`${body.error ?? 'Falha ao inicializar checkout.'}${details ? ` — ${String(details).slice(0, 600)}` : ''}`);
        }
        setClientSecret(body.clientSecret);
        if (body.productImage) setProductImage(body.productImage);
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
    setProductImage(null);
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
              <div className="flex min-w-0 items-start gap-3">
                {productImage && drawerState !== 'success' && (
                  <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white ${isDark ? 'border-white/10' : 'border-ink/10'}`} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productImage} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
                  </span>
                )}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                  aria-live="polite"
                  aria-busy="true"
                >
                  {/* Spinner central com brilho rosado */}
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="relative">
                      <motion.div
                        animate={reduce ? {} : { rotate: 360 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                        className={`h-14 w-14 rounded-full border-2 ${isDark ? 'border-white/10' : 'border-ink/10'} border-t-[#ff2e6a] shadow-[0_0_20px_rgba(255,46,106,0.25)]`}
                        aria-hidden="true"
                      />
                      <motion.div
                        animate={reduce ? {} : { scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-[14px] rounded-full bg-[#ff2e6a]/15"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <Lock size={16} className="text-[#ff2e6a]" strokeWidth={2} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-ink'}`}>Abrindo checkout seguro…</p>
                      <p className={`mt-1 font-mono text-[11px] uppercase tracking-[0.16em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}>
                        <motion.span
                          animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        >
                          Criptografando • PCI-DSS
                        </motion.span>
                      </p>
                    </div>
                  </div>

                  {/* Skeletons com shimmer */}
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: FLUID_EASE }}
                      className={`h-12 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'} relative overflow-hidden`}
                    >
                      <motion.div
                        animate={reduce ? {} : { x: ['-100%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        aria-hidden="true"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18, duration: 0.4, ease: FLUID_EASE }}
                      className={`h-12 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'} relative overflow-hidden`}
                    >
                      <motion.div
                        animate={reduce ? {} : { x: ['-100%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        aria-hidden="true"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.26, duration: 0.4, ease: FLUID_EASE }}
                      className={`h-[88px] rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-ink/10 bg-ink/[0.04]'} relative overflow-hidden`}
                    >
                      <motion.div
                        animate={reduce ? {} : { x: ['-100%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        aria-hidden="true"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {drawerState === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: FLUID_EASE }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-6 text-sm leading-relaxed"
                  role="alert"
                >
                  <motion.div
                    animate={reduce ? {} : { x: [0, -6, 6, -6, 6, 0] }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                      className="grid h-14 w-14 place-items-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                      aria-hidden="true"
                    >
                      <motion.svg width="26" height="26" viewBox="0 0 24 24" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: FLUID_EASE }}>
                        <motion.path d="M 6 6 L 18 18 M 18 6 L 6 18" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.45, delay: 0.35, ease: FLUID_EASE }} />
                      </motion.svg>
                    </motion.div>
                    <div>
                      <p className={`font-display text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Pagamento não aprovado</p>
                      <p className={`mt-1 max-w-sm text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-ink/60'}`}>{errorMsg ?? 'Tente outro método de pagamento.'}</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4, ease: FLUID_EASE }} className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <motion.button
                      type="button"
                      whileHover={reduce ? undefined : { scale: 1.02 }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        setDrawerState('loading');
                        setErrorMsg(null);
                        fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId }) })
                          .then((r) => r.json().then((b) => ({ ok: r.ok, body: b as { clientSecret?: string; error?: string; details?: unknown } })))
                          .then(({ ok, body: b }) => {
                            if (ok && b.clientSecret) {
                              setClientSecret(b.clientSecret);
                              setDrawerState('ready');
                            } else {
                              const details = typeof b.details === 'string' ? b.details : b.details ? JSON.stringify(b.details) : '';
                              throw new Error(`${b.error ?? 'Falha'}${details ? ` — ${String(details).slice(0, 600)}` : ''}`);
                            }
                          })
                          .catch((e: unknown) => {
                            const m = e instanceof Error ? e.message : 'Erro';
                            setErrorMsg(m);
                            setDrawerState('error');
                          });
                      }}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition ${isDark ? 'border-white/10 bg-white text-black hover:bg-white/90' : 'border-ink/10 bg-ink text-white hover:bg-ink/90'}`}
                    >
                      <Loader2 size={14} className="hidden" aria-hidden="true" />
                      Tentar novamente
                    </motion.button>
                    <button type="button" onClick={handleClose} className={`rounded-xl border px-5 py-2.5 text-xs font-medium transition ${isDark ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white' : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10'}`}>
                      Fechar
                    </button>
                  </motion.div>
                  <p className={`mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>Se o erro persistir, tente outro cartão ou Pix</p>
                </motion.div>
              )}

              {drawerState === 'ready' && clientSecret && (
                <CheckoutProviderWrapper clientSecret={clientSecret} onSuccess={() => setDrawerState('success')} onError={(msg) => { setErrorMsg(msg); setDrawerState('error'); }} amountLabel={amountLabel} />
              )}

              {drawerState === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: FLUID_EASE }}
                  className="flex flex-col items-center gap-5 py-8 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
                    className="relative grid h-16 w-16 place-items-center"
                    aria-hidden="true"
                  >
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.25, 1], opacity: [0, 0.25, 0] }}
                      transition={{ duration: 1.2, delay: 0.2, ease: FLUID_EASE }}
                      className="absolute inset-0 rounded-full bg-[#ff2e6a]/20"
                    />
                    <div className="grid h-16 w-16 place-items-center rounded-full border border-[#ff2e6a]/30 bg-[#ff2e6a]/10 text-[#ff2e6a] shadow-[0_0_28px_rgba(255,46,106,0.35)]">
                      <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="overflow-visible">
                        <motion.path d="M 6 12.5 L 10.5 17 L 18 8" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
                      </motion.svg>
                    </div>
                    {/* confetes sutis */}
                    {!reduce && (
                      <>
                        <motion.span animate={{ y: [-2, -10, -2], x: [-1, 1, -1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }} className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-[#ff2e6a]" />
                        <motion.span animate={{ y: [-1, -8, -1], x: [1, -1, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.9, repeat: Infinity, delay: 0.8 }} className="absolute -left-1 top-2 h-1 w-1 rounded-full bg-white" />
                      </>
                    )}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: FLUID_EASE }}>
                    <h3 className={`font-display text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>Pagamento aprovado</h3>
                    <p className={`mx-auto mt-2 max-w-sm text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-ink/60'}`}>
                      Recebemos seu pagamento de <span className={`font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{amountLabel}</span> para <span className={isDark ? 'text-white' : 'text-ink'}>{productTitle}</span>. Enviamos a confirmação por e-mail.
                    </p>
                  </motion.div>
                  <motion.a
                    href={`https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4, ease: FLUID_EASE }}
                    className="btn-primary-nex"
                    whileHover={reduce ? undefined : { scale: 1.03 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                  >
                    Falar no WhatsApp
                    <span className="shimmer-sweep" aria-hidden="true" />
                  </motion.a>
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className={`text-sm underline underline-offset-4 ${isDark ? 'text-white/50 hover:text-white/80' : 'text-ink/50 hover:text-ink/80'}`}
                  >
                    Fechar
                  </motion.button>
                </motion.div>
              )}
            </div>

            {drawerState !== 'success' && (
              <div className={`border-t px-6 py-4 md:px-7 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`}>
                <p className={`flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
                  <Lock size={12} strokeWidth={2} aria-hidden="true" />
                  Checkout Sessions • PCI-DSS • Nenhum dado salvo no navegador
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
