'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { LEGAL_DOCS, type LegalDoc } from './legal-content';
import { useTheme } from './ThemeProvider';
import { useScrollLock } from './useScrollLock';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface LegalModalProps {
  open: boolean;
  initialSlug?: LegalDoc['slug'];
  onClose: () => void;
}

// Modal/tab com o mesmo comportamento do checkout:
// backdrop + painel, body lock, ESC, scroll isolado (data-lenis-prevent),
// abas para Privacidade / Termos / LGPD / Reembolso / Cookies.
export function LegalModal({ open, initialSlug = 'privacidade', onClose }: LegalModalProps) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [slug, setSlug] = useState<LegalDoc['slug']>(initialSlug);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza aba inicial ao reabrir o modal
      setSlug(initialSlug);
    }
  }, [open, initialSlug]);

  const handleClose = useCallback(() => {
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

  // Trava real do scroll (lenis.stop() + overflow). Ver useScrollLock.
  useScrollLock(open);

  const doc: LegalDoc = LEGAL_DOCS.find((d) => d.slug === slug) ?? LEGAL_DOCS[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="legal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: FLUID_EASE }}
            className={`fixed inset-0 z-[70] backdrop-blur-[8px] ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            key="legal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.45, ease: FLUID_EASE }}
            className={`fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] border shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-[20px] md:inset-0 md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:mx-0 md:max-h-[88dvh] md:w-[520px] md:-translate-y-1/2 md:rounded-3xl ${
              isDark ? 'border-white/10 bg-[#0a0a0a]/95' : 'border-ink/10 bg-white/95'
            }`}
          >
            <div className={`relative flex items-start justify-between gap-4 border-b px-6 py-5 ${isDark ? 'border-white/10' : 'border-ink/10'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-[#ff2e6a]/10 text-[#ff2e6a]" aria-hidden="true">
                  <FileText size={17} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-white/40' : 'text-ink/40'}`}>
                    NexOS · Legal
                  </p>
                  <h2 id="legal-modal-title" className={`truncate font-display text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                    {doc.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar documento legal"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/30'
                    : 'border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink focus-visible:ring-ink/20'
                }`}
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {/* Abas */}
            <div className={`flex gap-1.5 overflow-x-auto border-b px-4 py-3 ${isDark ? 'border-white/10' : 'border-ink/10'}`} role="tablist" aria-label="Documentos legais">
              {LEGAL_DOCS.map((d) => {
                const active = d.slug === slug;
                return (
                  <button
                    key={d.slug}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setSlug(d.slug)}
                    className={`shrink-0 rounded-lg px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                      active
                        ? 'bg-[#ff2e6a] text-white shadow-[0_0_16px_rgba(255,46,106,0.5)]'
                        : isDark
                          ? 'bg-white/[0.05] text-white/55 hover:bg-white/10 hover:text-white'
                          : 'bg-ink/[0.04] text-ink/55 hover:bg-ink/10 hover:text-ink'
                    }`}
                  >
                    {d.tab}
                  </button>
                );
              })}
            </div>

            <div
              data-lenis-prevent
              className="relative flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6 py-6"
              style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
              role="tabpanel"
            >
              <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/35' : 'text-ink/40'}`}>{doc.updated}</p>
              <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-ink/70'}`}>{doc.intro}</p>
              <div className="mt-5 space-y-5">
                {doc.sections.map((s) => (
                  <div key={s.heading}>
                    <h3 className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>{s.heading}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed ${isDark ? 'text-white/65' : 'text-ink/65'}`}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border-t px-6 py-4 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-ink/10 bg-ink/[0.02]'}`}>
              <p className={`flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-white/30' : 'text-ink/35'}`}>
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" />
                Dúvidas? nexosperformance@gmail.com
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LegalModal;
