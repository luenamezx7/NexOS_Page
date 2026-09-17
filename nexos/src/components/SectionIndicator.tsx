'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react';

interface SectionDef {
  id: string;
  label: string;
  number: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'hero', label: 'Início', number: '01' },
  { id: 'services', label: 'Serviços', number: '02' },
  { id: 'testimonials', label: 'Ecossistema', number: '03' },
  { id: 'faq', label: 'FAQ', number: '04' },
  { id: 'contact', label: 'Contato', number: '05' },
];

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SectionIndicator() {
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // pick the entry most visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    els.forEach((el) => observer.observe(el));

    // fallback: handle top / bottom edges
    const onScroll = (): void => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.offsetTop <= scrollPos) current = s.id;
      }
      // footer depth guard - near bottom force last section
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
        current = SECTIONS[SECTIONS.length - 1].id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      els.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleClick = useCallback((id: string) => {
    scrollToId(id);
  }, []);

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);

  return (
    <nav
      aria-label="Navegação de seções"
      className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 xl:flex"
    >
      <div className="relative ml-6 flex flex-col items-start py-6">
        {/* Track */}
        <div className="pointer-events-none absolute left-[11px] top-6 bottom-6 w-px bg-ink/10" aria-hidden="true" />
        {/* Progress — grows with scroll */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-[11px] top-6 bottom-6 w-px origin-top bg-[var(--section-indicator)]"
          style={
            reduce
              ? { boxShadow: '0 0 6px var(--section-indicator-glow)' } as React.CSSProperties
              : ({ scaleY, boxShadow: '0 0 6px var(--section-indicator-glow)' } as unknown as React.CSSProperties)
          }
        />
        {/* Fallback for reduced motion: discrete segment */}
        {reduce && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[11px] w-px bg-[var(--section-indicator)] transition-all duration-500"
            style={{
              top: '24px',
              height: `${((activeIndex + 0.5) / SECTIONS.length) * 100}%`,
              maxHeight: 'calc(100% - 48px)',
            }}
          />
        )}

        <ul className="flex flex-col gap-7" role="list">
          {SECTIONS.map((section, idx) => {
            const isActive = section.id === activeId;
            const isPast = idx < activeIndex;

            const isEcossistema = section.id === 'testimonials';

            return (
              <li key={section.id} className="relative flex flex-col">
                <button
                  type="button"
                  onClick={() => handleClick(section.id)}
                  aria-label={`Ir para ${section.label}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="group flex items-center gap-3.5 rounded-full pl-1 pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  {/* Dot */}
                  <span className="relative grid h-[22px] w-[22px] shrink-0 place-items-center">
                    {/* outer ring on active */}
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 0.7,
                      }}
                      transition={{ duration: 0.4, ease: FLUID_EASE }}
                      className="absolute inset-0 rounded-full border border-[var(--section-indicator)]/18 bg-[var(--section-indicator)]/5"
                      style={{ display: isActive ? 'block' : 'none' }}
                    />
                    {/* core */}
                    <motion.span
                      aria-hidden="true"
                      animate={{
                        scale: isActive ? 1 : isPast ? 0.85 : 1,
                        backgroundColor: isActive ? 'var(--section-indicator)' : isPast ? 'var(--section-indicator)' : 'transparent',
                        borderColor: isActive || isPast ? 'var(--section-indicator)' : 'color-mix(in srgb, var(--color-ink) 18%, transparent)',
                      }}
                      transition={{ duration: 0.4, ease: FLUID_EASE }}
                      className="relative h-2.5 w-2.5 rounded-[2px] border will-change-transform"
                      style={{
                        backgroundColor: isActive || isPast ? 'var(--section-indicator)' : 'transparent',
                        boxShadow: isActive ? '0 0 6px var(--section-indicator-glow)' : undefined,
                      }}
                    />
                    {/* ping when active */}
                    {isActive && !reduce && (
                      <motion.span
                        aria-hidden="true"
                        initial={{ scale: 0.6, opacity: 0.22 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute h-2.5 w-2.5 rounded-[2px] bg-[var(--section-indicator)]"
                      />
                    )}
                  </span>

                  {/* Label cluster */}
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-[10px] leading-none tracking-[0.18em] transition-colors duration-300 ${
                        isActive ? 'text-ink' : 'text-ink/35 group-hover:text-ink/60'
                      }`}
                    >
                      {section.number}
                    </span>

                    {/* divider */}
                    <span
                      aria-hidden="true"
                      className={`h-px transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive ? 'w-6 bg-[var(--section-indicator)]/25' : 'w-3 bg-ink/15 group-hover:w-4 group-hover:bg-ink/25'
                      }`}
                    />

                    <span
                      className={`whitespace-nowrap font-mono text-[11px] uppercase leading-none tracking-[0.16em] transition-all duration-300 ${
                        isActive
                          ? 'text-ink opacity-100 translate-x-0'
                          : 'text-ink/45 opacity-70 group-hover:text-ink/70 group-hover:opacity-100'
                      }`}
                    >
                      {section.label}
                    </span>
                  </span>

                  {/* Active bg pill */}
                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1 : 0.96,
                    }}
                    transition={{ duration: 0.4, ease: FLUID_EASE }}
                    className="pointer-events-none absolute inset-0 -z-10 rounded-full border border-ink/10 bg-ink/[0.04] backdrop-blur-sm"
                    style={{ display: isActive ? 'block' : 'none' }}
                  />
                </button>

                {/* Sub-pilares — só no Ecossistema ativo, estética Directive */}
                {isEcossistema && isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: FLUID_EASE }}
                    className="ml-[11px] mt-3 flex flex-col gap-1.5 border-l border-ink/10 pl-4"
                    aria-hidden="true"
                  >
                    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-ink/30">
                      TECNOLOGIA FÍSICA
                    </span>
                    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-ink/30">
                      CHECKOUT
                    </span>
                    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-ink/30">
                      ENGINE
                    </span>
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Counter + hint at bottom of rail */}
        <div className="mt-8 flex flex-col gap-2 pl-[7px]" aria-hidden="true">
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink/30">
            {String(activeIndex + 1).padStart(2, '0')} <span className="text-ink/15">/</span> {String(SECTIONS.length).padStart(2, '0')}
          </span>
          <span className="h-6 w-px bg-gradient-to-b from-ink/15 to-transparent" />
        </div>
      </div>
    </nav>
  );
}

export default SectionIndicator;
