'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useScrollLock } from './useScrollLock';

// ============================================================
// NexOS — Consentimento de Cookies (LGPD)
// - Banner inferior (sem body lock: não bloqueia navegação)
// - Central de preferências em modal (mesmo padrão do checkout/
//   LegalModal: backdrop, body lock, ESC, scroll isolado)
// - Persistência: localStorage `nexos-cookie-consent-v1` (12 meses)
// - Categorias: necessary (sempre on) + functional + analytics + marketing
// - Hook de gating: window.__nexosConsent + evento `nexos:consent-updated`
//   (use para só carregar GA4/pixels após aceite de analytics/marketing)
// ============================================================

export const COOKIE_CONSENT_KEY = 'nexos-cookie-consent-v1';
export const OPEN_PREFS_EVENT = 'nexos:open-cookie-preferences';
export const CONSENT_UPDATED_EVENT = 'nexos:consent-updated';

export interface CookieConsent {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: '',
};

function readStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return {
      necessary: true,
      functional: !!parsed.functional,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

function persistConsent(value: Omit<CookieConsent, 'necessary' | 'updatedAt'>): CookieConsent {
  const next: CookieConsent = {
    necessary: true,
    ...value,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  } catch {
    /* storage indisponível (privado) — mantém só em memória */
  }
  try {
    (window as unknown as { __nexosConsent?: CookieConsent }).__nexosConsent = next;
    window.dispatchEvent(new CustomEvent<CookieConsent>(CONSENT_UPDATED_EVENT, { detail: next }));
  } catch {
    /* silencioso */
  }
  return next;
}

interface CookieConsentContextValue {
  consent: CookieConsent;
  hasDecided: boolean;
  openPreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCustom: (value: Omit<CookieConsent, 'necessary' | 'updatedAt'>) => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent deve ser usado dentro de <CookieConsentProvider>');
  return ctx;
}

/** Abre a central de preferências de qualquer lugar (ex.: rodapé). */
export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
}

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface CategoryDef {
  key: 'functional' | 'analytics' | 'marketing';
  title: string;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'functional',
    title: 'Funcionais',
    description: 'Lembram preferências de UX (ex.: suavidade de scroll). Sem eles, o site funciona com padrões.',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    description: 'Medição anônima de visitas para melhorar conteúdo. Hoje desligado por padrão; só roda após aceite.',
  },
  {
    key: 'marketing',
    title: 'Marketing',
    description: 'Pixels de remarketing/campanhas. Hoje desligado por padrão; só roda após aceite.',
  },
];

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  // Hidratação sem setState em effect: lazy init lê o localStorage no 1º render client.
  // (SSR retorna defaults; o client corrige na hidratação — sem cascading renders.)
  const [storedInitial] = useState<CookieConsent | null>(() => {
    if (typeof window === 'undefined') return null;
    return readStoredConsent();
  });
  const [consent, setConsent] = useState<CookieConsent>(storedInitial ?? DEFAULT_CONSENT);
  const [hasDecided, setHasDecided] = useState<boolean>(storedInitial !== null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);
  const [prefsOpen, setPrefsOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState({
    functional: storedInitial?.functional ?? false,
    analytics: storedInitial?.analytics ?? false,
    marketing: storedInitial?.marketing ?? false,
  });
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Expõe gating global para o consentimento já salvo (só sistema externo, sem setState)
  useEffect(() => {
    if (!storedInitial) return;
    try {
      (window as unknown as { __nexosConsent?: CookieConsent }).__nexosConsent = storedInitial;
    } catch {
      /* silencioso */
    }
  }, [storedInitial]);

  // Banner com delay (setState dentro de timeout = subscription, permitido)
  useEffect(() => {
    if (storedInitial) return;
    const t = window.setTimeout(() => setBannerVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [storedInitial]);

  const acceptAll = useCallback(() => {
    const next = persistConsent({ functional: true, analytics: true, marketing: true });
    setConsent(next);
    setHasDecided(true);
    setBannerVisible(false);
    setPrefsOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    const next = persistConsent({ functional: false, analytics: false, marketing: false });
    setConsent(next);
    setHasDecided(true);
    setBannerVisible(false);
    setPrefsOpen(false);
  }, []);

  const saveCustom = useCallback((value: Omit<CookieConsent, 'necessary' | 'updatedAt'>) => {
    const next = persistConsent(value);
    setConsent(next);
    setHasDecided(true);
    setBannerVisible(false);
    setPrefsOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setDraft({
      functional: consent.functional,
      analytics: consent.analytics,
      marketing: consent.marketing,
    });
    setPrefsOpen(true);
  }, [consent]);

  // Evento global para o rodapé/páginas abrirem a central
  useEffect(() => {
    const onOpen = () => openPreferences();
    window.addEventListener(OPEN_PREFS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, onOpen);
  }, [openPreferences]);

  // ESC fecha a central
  useEffect(() => {
    if (!prefsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrefsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefsOpen]);

  // Trava real SÓ na central (modal). O banner nunca trava o scroll.
  useScrollLock(prefsOpen);

  const value = useMemo<CookieConsentContextValue>(
    () => ({ consent, hasDecided, openPreferences, acceptAll, rejectAll, saveCustom }),
    [consent, hasDecided, openPreferences, acceptAll, rejectAll, saveCustom],
  );

  const toggleDraft = (key: keyof typeof draft) =>
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      {/* ——— Banner LGPD (bottom, sem bloqueio) ——— */}
      <AnimatePresence>
        {!hasDecided && bannerVisible && !prefsOpen && (
          <motion.div
            key="cookie-banner"
            role="dialog"
            aria-live="polite"
            aria-label="Aviso de cookies"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: FLUID_EASE }}
            className="fixed inset-x-0 bottom-0 z-[65] px-4 pb-4 md:px-6 md:pb-6"
          >
            <div
              className={`mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-[20px] md:flex-row md:items-center md:gap-5 md:p-6 ${
                isDark ? 'border-white/10 bg-[#0a0a0a]/95' : 'border-ink/10 bg-white/95'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-[#ff2e6a]/10 text-[#ff2e6a]"
                  aria-hidden="true"
                >
                  <Cookie size={17} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${isDark ? 'text-white' : 'text-ink'}`}>
                    Usamos cookies — você escolhe
                  </p>
                  <p className={`mt-1 text-[13px] leading-relaxed ${isDark ? 'text-white/60' : 'text-ink/60'}`}>
                    Só o essencial roda por padrão. Analytics e marketing ficam desligados até você aceitar.{' '}
                    <Link href="/cookies" className="underline underline-offset-2 hover:opacity-80">
                      Política de Cookies
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                <button
                  type="button"
                  onClick={rejectAll}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                      : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={openPreferences}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                      : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  Personalizar
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-xl bg-[#ff2e6a] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(255,46,106,0.5)] transition hover:bg-[#ec4899]"
                >
                  Aceitar tudo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Central de preferências (modal, padrão checkout) ——— */}
      <AnimatePresence>
        {prefsOpen && (
          <>
            <motion.div
              key="cookie-prefs-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: FLUID_EASE }}
              className={`fixed inset-0 z-[70] backdrop-blur-[8px] ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
              onClick={() => setPrefsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="cookie-prefs-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-prefs-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.45, ease: FLUID_EASE }}
              className={`fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] border shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-[20px] md:inset-0 md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:mx-0 md:max-h-[88dvh] md:w-[520px] md:-translate-y-1/2 md:rounded-3xl ${
                isDark ? 'border-white/10 bg-[#0a0a0a]/95' : 'border-ink/10 bg-white/95'
              }`}
            >
              <div
                className={`relative flex items-start justify-between gap-4 border-b px-6 py-5 ${isDark ? 'border-white/10' : 'border-ink/10'}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-[#ff2e6a]/10 text-[#ff2e6a]"
                    aria-hidden="true"
                  >
                    <Cookie size={17} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}
                    >
                      NexOS · Privacidade
                    </p>
                    <h2
                      id="cookie-prefs-title"
                      className={`font-display text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}
                    >
                      Preferências de cookies
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefsOpen(false)}
                  aria-label="Fechar preferências de cookies"
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${
                    isDark
                      ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/30'
                      : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink focus-visible:ring-ink/20'
                  }`}
                >
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              <div
                data-lenis-prevent
                className="relative flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain px-6 py-6"
                style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
              >
                {/* Necessários — sempre ativos */}
                <div
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>
                      Estritamente necessários
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
                      Tema e sua escolha de cookies. Sempre ativos.
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full bg-[#28c840]/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#28c840]"
                    aria-label="Sempre ativos"
                  >
                    Sempre on
                  </span>
                </div>

                {CATEGORIES.map((cat) => {
                  const on = draft[cat.key];
                  return (
                    <div
                      key={cat.key}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-ink/10 bg-ink/[0.03]'}`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>{cat.title}</p>
                        <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-ink/55'}`}>
                          {cat.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${cat.title}: ${on ? 'ativado' : 'desativado'}`}
                        onClick={() => toggleDraft(cat.key)}
                        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2e6a]/60 ${
                          on ? 'border-[#ff2e6a] bg-[#ff2e6a]' : isDark ? 'border-white/15 bg-white/10' : 'border-ink/15 bg-ink/10'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-300 ${
                            on ? 'left-[22px]' : 'left-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}

                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/35' : 'text-ink/40'}`}>
                  Detalhes em <Link href="/cookies" className="underline underline-offset-2">/cookies</Link>. Sua escolha
                  vale por 12 meses e pode ser alterada no rodapé em “Gerenciar cookies”.
                </p>
              </div>

              <div
                className={`flex flex-col gap-2 border-t px-6 py-4 sm:flex-row ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`}
              >
                <button
                  type="button"
                  onClick={rejectAll}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                      : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink'
                  }`}
                >
                  Recusar tudo
                </button>
                <button
                  type="button"
                  onClick={() => saveCustom(draft)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-white/10 bg-white text-black hover:bg-white/90'
                      : 'border-ink/10 bg-ink text-white hover:bg-ink/90'
                  }`}
                >
                  Salvar escolhas
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 rounded-xl bg-[#ff2e6a] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(255,46,106,0.5)] transition hover:bg-[#ec4899]"
                >
                  Aceitar tudo
                </button>
              </div>

              <div className={`border-t px-6 py-3 ${isDark ? 'border-white/10' : 'border-ink/10'}`}>
                <p
                  className={`flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}
                >
                  <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" />
                  LGPD · sem rastreio antes do aceite
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CookieConsentContext.Provider>
  );
}

export default CookieConsentProvider;
