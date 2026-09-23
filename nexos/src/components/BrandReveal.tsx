'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useTheme } from './ThemeProvider';

// "O" center normalized inside logo completa (viewBox 308 15 1433 344 -> width 1433)
// O at x=800 => (800-308)/1433 = 0.343
const O_NORM_X = 0.343;

export default function BrandReveal() {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.4 });
  const [ready, setReady] = useState(false);
  const [oX, setOX] = useState(0);
  const [iconW, setIconW] = useState(0);
  const [iconH, setIconH] = useState(0);
  const [finalX, setFinalX] = useState(0);

  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/nexos-logo-dark.svg' : '/nexos-logo-light.svg';
  const oSrc = isDark ? '/nexos-O-personalizado.svg' : '/nexos-O-personalizado-light.svg';

  // O-personalizado: 257x307, rotacionado 90° → visual 307x257
  const measure = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const h = r.height;
    const w = r.width;
    // ícone rotacionado: altura visual = 257*scale = 100% da logo (proporcional vertical)
    const scale = h / 257;
    const iw = 307 * scale; // largura visual após rotação
    const ih = 257 * scale; // altura visual após rotação
    // O center inside cropped container
    const ox = w * O_NORM_X - iw / 2;
    // final position: gap 24% of logo height
    const gap = h * 0.26;
    const fx = w + gap;
    setOX(ox);
    setIconW(iw);
    setIconH(ih);
    setFinalX(fx);
    setReady(true);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    const el = logoRef.current;
    if (!el) return () => cancelAnimationFrame(id);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure]);

  if (reduce) {
    return (
      <section ref={sectionRef} aria-label="NexOS" className="relative flex min-h-[92svh] w-full items-center justify-center overflow-x-clip border-y border-ink/10 bg-canvas px-4">
        <div className="flex items-center justify-center gap-6 md:gap-8">
          <div ref={logoRef} className="relative" style={{ width: 'clamp(200px, 42vw, 460px)', aspectRatio: '1433 / 344' }}>
            <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain" draggable={false} />
          </div>
          <img src={oSrc} alt="" aria-hidden="true" className="shrink-0 object-contain" style={{ width: iconW || 90, height: iconH || 52, rotate: '90deg' }} draggable={false} />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="NexOS"
      className="relative flex min-h-[92svh] w-full items-center justify-center overflow-x-clip border-y border-ink/10 bg-canvas px-4"
    >
      <div className="relative flex items-center justify-center" style={{ width: 'clamp(260px, 58vw, 640px)' }}>
        {/* Logo completa NexOS */}
        <motion.div
          ref={logoRef}
          className="relative"
          style={{ width: '100%', aspectRatio: '1433 / 344' }}
          initial={{ opacity: 0 }}
          animate={inView && ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain" draggable={false} />
        </motion.div>

        {/* O personalizado 90° sobre o O, depois desliza para direita */}
        {ready && (
          <motion.img
            src={oSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute top-1/2 object-contain will-change-transform"
            style={{
              width: iconW,
              height: iconH,
              y: '-50%',
              left: 0,
              rotate: '90deg',
            }}
            initial={{ opacity: 0, x: oX, scale: 0.98 }}
            animate={
              inView
                ? {
                    opacity: [0, 0, 1, 1, 1],
                    scale: [0.98, 0.98, 1, 1, 1],
                    x: [oX, oX, oX, oX, finalX],
                  }
                : { opacity: 0, x: oX, scale: 0.98 }
            }
            transition={{
              duration: 2.75,
              times: [0, 0.327, 0.4, 0.6, 1],
              ease: 'linear',
            }}
          />
        )}
      </div>
    </section>
  );
}
