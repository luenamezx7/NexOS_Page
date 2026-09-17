'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react';

interface SectionDef {
  id: string;
  label: string;
  number: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'hero', label: 'Início', number: '01' },
  { id: 'services', label: 'Serviços', number: '02' },
  { id: 'testimonials', label: 'Documentação & Ecossistema', number: '03' },
  { id: 'faq', label: 'FAQ', number: '04' },
  { id: 'contact', label: 'Contato', number: '05' },
];

function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// NexOS — SectionIndicator minimalista (neon/cyberpunk sutil)
// - Mantém paleta primária (pink #ff2e6a) com glow box-shadow discreto
// - Sem ping loops / pills / sub-pilares (eram camadas extras que
//   forçavam repaint durante o scroll pelo Ecossistema)
// - Progress só com transform scaleY (GPU). Observer com threshold
//   único + fallback de scroll com throttle via rAF (sem reflow por frame)
// ============================================================

export function SectionIndicator() {
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    restDelta: 0.001,
  });

  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      },
    );

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    els.forEach((el) => observer.observe(el));

    // Fallback com rAF-throttle: evita offsetTop/getBoundingClientRect a cada frame
    const onScroll = (): void => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const mid = window.scrollY + window.innerHeight * 0.5;
        let current = SECTIONS[0].id;
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (!el) continue;
          if (el.offsetTop <= mid) current = s.id;
        }
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
          current = SECTIONS[SECTIONS.length - 1].id;
        }
        setActiveId((prev) => (prev === current ? prev : current));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      els.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleClick = useCallback((id: string) => {
    scrollToId(id);
  }, []);

  const activeIndex = Math.max(
    0,
    SECTIONS.findIndex((s) => s.id === activeId),
  );

  return (
    <nav
      aria-label="Navegação de seções"
      className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <div className="relative ml-5 flex flex-col py-4">
        {/* Trilho fino */}
        <div
          className="pointer-events-none absolute bottom-4 left-[7px] top-4 w-px bg-ink/10"
          aria-hidden="true"
        />
        {/* Progresso neon sutil — só transform (GPU) + glow estático */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 left-[7px] top-4 w-px origin-top bg-[#ff2e6a]"
          style={
            reduce
              ? {
                  boxShadow:
                    '0 0 8px rgba(255,46,106,0.45), 0 0 2px rgba(255,46,106,0.8)',
                }
              : ({
                  scaleY,
                  boxShadow:
                    '0 0 8px rgba(255,46,106,0.45), 0 0 2px rgba(255,46,106,0.8)',
                } as unknown as React.CSSProperties)
          }
        />

        <ul className="flex flex-col gap-5" role="list">
          {SECTIONS.map((section, idx) => {
            const isActive = section.id === activeId;
            const isPast = idx < activeIndex;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => handleClick(section.id)}
                  aria-label={`Ir para ${section.label}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="group flex max-w-[220px] items-center gap-3 rounded-md py-0.5 pl-0 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2e6a]/60"
                >
                  <span className="relative grid h-4 w-4 shrink-0 place-items-center">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-[2px] border transition-colors duration-300"
                      style={
                        isActive
                          ? {
                              backgroundColor: '#ff2e6a',
                              borderColor: '#ff2e6a',
                              boxShadow:
                                '0 0 8px rgba(255,46,106,0.55), 0 0 2px rgba(255,46,106,0.9)',
                            }
                          : isPast
                            ? {
                                backgroundColor: 'rgba(255,46,106,0.45)',
                                borderColor: 'rgba(255,46,106,0.45)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                borderColor:
                                  'color-mix(in srgb, var(--color-ink) 22%, transparent)',
                              }
                      }
                    />
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`font-mono text-[10px] leading-none tracking-[0.18em] transition-colors duration-300 ${
                        isActive ? 'text-ink' : 'text-ink/35 group-hover:text-ink/65'
                      }`}
                    >
                      {section.number}
                    </span>
                    <span
                      className={`truncate font-mono text-[10px] uppercase leading-none tracking-[0.16em] transition-colors duration-300 ${
                        isActive
                          ? 'text-ink'
                          : 'text-ink/45 group-hover:text-ink/70'
                      }`}
                      style={
                        isActive
                          ? { textShadow: '0 0 12px rgba(255,46,106,0.35)' }
                          : undefined
                      }
                    >
                      {section.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pl-0.5" aria-hidden="true">
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink/30">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="text-ink/15"> / </span>
            {String(SECTIONS.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default SectionIndicator;
