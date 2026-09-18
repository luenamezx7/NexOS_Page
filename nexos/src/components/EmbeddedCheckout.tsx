'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Lock, QrCode } from 'lucide-react';
import { config } from '@/config';
import { useTheme } from './ThemeProvider';
import { useScrollLock } from './useScrollLock';
import { InfinityPixPane } from './InfinityPixPane';

// ============================================================
// NexOS — Checkout InfinitePay (Pix, cartão, carteiras)
// Fluxo único: nome + e-mail → gerar cobrança → checkout InfinitePay →
// polling de confirmação → sucesso.
// ============================================================

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface EmbeddedCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  productTitle: string;
  productPrice: number;
  quantity?: number;
}

type DrawerState = 'idle' | 'success';

// Campos do cliente com feedback inline (mesmo padrão do contato).
function CustomerFields({
  name,
  email,
  nameError,
  emailError,
  onNameChange,
  onEmailChange,
  onNameBlur,
  onEmailBlur,
}: {
  name: string;
  email: string;
  nameError: string | null;
  emailError: string | null;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNameBlur: () => void;
  onEmailBlur: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="checkout-name" className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
          Nome completo *
        </label>
        <input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameBlur}
          placeholder="Seu nome completo"
          autoComplete="name"
          required
          aria-invalid={nameError ? 'true' : 'false'}
          aria-describedby={nameError ? 'checkout-name-error' : undefined}
          className={`field-input ${nameError ? '!border-red-500/60' : ''}`}
        />
        {nameError && (
          <p id="checkout-name-error" className="text-xs text-red-500" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="checkout-email" className={`font-mono text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
          E-mail para recibo *
        </label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onBlur={onEmailBlur}
          placeholder="seu@email.com"
          autoComplete="email"
          required
          aria-invalid={emailError ? 'true' : 'false'}
          aria-describedby={emailError ? 'checkout-email-error' : undefined}
          className={`field-input ${emailError ? '!border-red-500/60' : ''}`}
        />
        {emailError && (
          <p id="checkout-email-error" className="text-xs text-red-500" role="alert">
            {emailError}
          </p>
        )}
      </div>
    </div>
  );
}

export function EmbeddedCheckoutDrawer({ open, onClose, productId, productTitle, productPrice, quantity = 1 }: EmbeddedCheckoutDrawerProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [drawerState, setDrawerState] = useState<DrawerState>('idle');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setDrawerState('idle');
    setNameError(null);
    setEmailError(null);
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

  // Trava real do scroll: lenis.stop() + overflow + compensação da
  // scrollbar. O scroll fica restrito ao container interno
  // (data-lenis-prevent + overscroll-contain). Ver useScrollLock.
  useScrollLock(open);

  const validateNameBlur = useCallback(() => {
    if (!customerName.trim()) setNameError('Nome completo é obrigatório');
    else if (customerName.trim().length < 3) setNameError('Informe seu nome completo');
    else setNameError(null);
  }, [customerName]);

  const validateEmailBlur = useCallback(() => {
    if (!customerEmail.trim()) setEmailError('E-mail é obrigatório para o recibo');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) setEmailError('E-mail inválido');
    else setEmailError(null);
  }, [customerEmail]);

  const amountLabel = `R$ ${(productPrice * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
            className={`fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] border shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-[20px] will-change-transform md:inset-0 md:m-auto md:h-fit md:max-h-[88dvh] md:w-[min(480px,calc(100vw-2rem))] md:rounded-3xl ${
              isDark ? 'border-white/10 bg-[#0a0a0a]/90' : 'border-ink/10 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.18)]'
            }`}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-white/15' : 'via-ink/10'}`} aria-hidden="true" />
            <div className={`pointer-events-none absolute inset-0 rounded-t-[24px] md:rounded-3xl ${isDark ? 'bg-gradient-to-b from-white/[0.07] to-transparent' : 'bg-gradient-to-b from-ink/[0.03] to-transparent'}`} aria-hidden="true" />

            <div className={`relative flex items-start justify-between gap-4 border-b px-6 py-5 md:px-7 ${isDark ? 'border-white/10' : 'border-ink/10'}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-[#ff2e6a]/10 text-[#ff2e6a]`} aria-hidden="true">
                  <QrCode size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}>Checkout seguro</p>
                  <h2 id="embedded-checkout-title" className={`mt-1 truncate font-display text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    {drawerState === 'success' ? 'Pagamento confirmado' : productTitle}
                  </h2>
                  {drawerState !== 'success' && (
                    <p className={`mt-1 font-mono text-xs ${isDark ? 'text-white/50' : 'text-ink/55'}`}>
                      {amountLabel} • Pix ou cartão • confirmação automática
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

            <div
              data-lenis-prevent
              className="relative flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6 py-6 md:px-7 md:py-7"
              style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
            >
              {drawerState === 'success' ? (
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
                  >
                    Falar no WhatsApp
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
              ) : (
                <div className="flex flex-col gap-5">
                  <CustomerFields
                    name={customerName}
                    email={customerEmail}
                    nameError={nameError}
                    emailError={emailError}
                    onNameChange={(v) => { setCustomerName(v); if (nameError) setNameError(null); }}
                    onEmailChange={(v) => { setCustomerEmail(v); if (emailError) setEmailError(null); }}
                    onNameBlur={validateNameBlur}
                    onEmailBlur={validateEmailBlur}
                  />
                  <InfinityPixPane
                    productId={productId}
                    productPrice={productPrice}
                    quantity={quantity}
                    name={customerName}
                    email={customerEmail}
                    onNameError={setNameError}
                    onEmailError={setEmailError}
                    nameError={nameError}
                    emailError={emailError}
                    onSuccess={() => setDrawerState('success')}
                  />
                </div>
              )}
            </div>

            {drawerState !== 'success' && (
              <div className={`border-t px-6 py-4 md:px-7 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`} style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <p className={`flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
                  <Lock size={12} strokeWidth={2} aria-hidden="true" />
                  Pix, cartão e carteiras • Nenhum dado salvo no navegador
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
