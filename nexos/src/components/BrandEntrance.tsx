'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { RobotCycler } from './RobotCycler';

const OS_NORM_X = 0.795;
const OS_NORM_Y = 0.491;
const OS_NORM_W = 0.385;
const OS_NORM_H = 0.889;

export default function BrandEntrance({ onComplete }: { onComplete: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const logoRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const canFinishRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [oX, setOX] = useState(0);
  const [oY, setOY] = useState(0);
  const [iconW, setIconW] = useState(0);
  const [iconH, setIconH] = useState(0);
  const [finalX, setFinalX] = useState(0);
  const [finalY, setFinalY] = useState(0);
  const [logoShift, setLogoShift] = useState(0);

  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/nexos-logo-dark.svg' : '/nexos-logo-light.svg';

  const finish = useCallback(() => {
    if (completedRef.current || !canFinishRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const measure = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const h = r.height;
    const w = r.width;
    const osW = w * OS_NORM_W;
    const osH = h * OS_NORM_H;
    const osCenterX = w * OS_NORM_X;
    const osCenterY = h * OS_NORM_Y;
    const scale = Math.min(osW / 307, osH / 257);
    const iw = 307 * scale;
    const ih = 257 * scale;
    const ox = osCenterX - iw / 2;
    const oy = osCenterY - ih / 2;
    const gap = h * 0.28;
    const shift = -(iw + gap) / 2;
    const fx = w + gap + shift;
    const fy = h * 0.5 - ih / 2;
    setOX(ox);
    setOY(oy);
    setIconW(iw);
    setIconH(ih);
    setFinalX(fx);
    setFinalY(fy);
    setLogoShift(shift);
    setReady(true);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      measure();
      setInView(true);
    });
    const fallback = setTimeout(() => {
      if (!ready) {
        setIconW(88); setIconH(74); setOX(108); setOY(18); setFinalX(365); setFinalY(12); setLogoShift(-58); setReady(true); setInView(true);
      }
    }, 600);
    const el = logoRef.current;
    if (el) {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => { cancelAnimationFrame(id); clearTimeout(fallback); ro.disconnect(); };
    }
    return () => { cancelAnimationFrame(id); clearTimeout(fallback); };
  }, [measure, ready]);

  useEffect(() => {
    const t = setTimeout(() => { canFinishRef.current = true; }, 2850);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => { if (!completedRef.current) { canFinishRef.current = true; finish(); } }, 5800);
    return () => clearTimeout(t);
  }, [finish]);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (Math.abs(e.deltaY) > 8) finish(); };
    const onTouchEnd = () => finish();
    const onKey = (e: KeyboardEvent) => { if ([' ', 'ArrowDown', 'Enter', 'PageDown', 'Escape'].includes(e.key)) { e.preventDefault(); finish(); } };
    const onClick = () => finish();
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [finish]);

  if (reduce) {
    return (
      <motion.div
        role="region" aria-label="NexOS"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(6px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[850] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4"
        onClick={finish}
      >
        <div className="grid-pattern-subtle opacity-[0.32] dark:opacity-[0.06]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_50%,rgba(255,92,138,0.07),transparent_70%)]" aria-hidden="true" />
        <div className="relative flex items-center justify-center gap-6 md:gap-8">
          <div ref={logoRef} className="relative" style={{ width: 'clamp(200px, 42vw, 460px)', aspectRatio: '1433 / 344' }}>
            <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain" draggable={false} />
          </div>
          <RobotCycler className="logo-invert shrink-0" style={{ width: iconW || 88, height: iconH || 74 }} intervalMs={1600} fadeMs={600} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="region" aria-label="NexOS"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[850] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas"
      onClick={finish}
    >
      {/* Fundo refinado — inspirado no Hero/ProductShowcase */}
      <div className="grid-pattern-subtle opacity-[0.30] dark:opacity-[0.05]" aria-hidden="true" />
      {/* Halo radial suave atrás da marca */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[78%] max-w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-[radial-gradient(68%_58%_at_50%_50%,rgba(255,92,138,0.10),transparent_72%)] blur-[0.5px] dark:bg-[radial-gradient(68%_58%_at_50%_50%,rgba(255,92,138,0.14),transparent_72%)]"
      />
      {/* Velo sutil inferior */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 0.4 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-ink/[0.04] via-ink/[0.02] to-transparent dark:from-white/[0.04] dark:via-white/[0.015] dark:to-transparent"
      />
      {/* Moldura premium — double hairline, como AcrylicPlate */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        className="pointer-events-none absolute inset-[18px] rounded-[1.5rem] border border-ink/[0.06] dark:border-white/[0.06] md:inset-[28px] md:rounded-[2rem]"
      />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.45 }}
        className="pointer-events-none absolute inset-[19px] rounded-[1.5rem] border border-ink/[0.03] dark:border-white/[0.03] md:inset-[29px] md:rounded-[2rem]"
      />

      {/* Label superior */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute top-10 flex items-center gap-2.5 md:top-12"
      >
        <span className="h-px w-7 bg-gradient-to-r from-transparent to-[#ff5c8a]/35" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-1 text-ink/50 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff5c8a]" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Identidade NexOS</span>
        </span>
        <span className="h-px w-7 bg-gradient-to-l from-transparent to-[#ff5c8a]/35" aria-hidden="true" />
      </motion.div>

      {/* Conjunto central — logo + O 90° */}
      <div className="relative flex items-center justify-center px-6" style={{ width: 'min(92vw, 680px)' }}>
        {/* Reflexo sutil atrás da logo, como glass-header */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-ink/[0.07] to-transparent dark:via-white/[0.06]"
        />
        <motion.div
          ref={logoRef}
          className="relative"
          style={{ width: '100%', aspectRatio: '1433 / 344' }}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)', x: 0 }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)', x: ready ? logoShift : 0 } : { opacity: 0, y: 8, filter: 'blur(6px)', x: 0 }}
          transition={{
            opacity: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
            filter: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
            x: { duration: 0.95, ease: [0.45, 0, 0.2, 1], delay: 1.85 },
          }}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-[-8%] -z-10 rounded-full bg-gradient-to-r from-[#ff5c8a]/16 via-[#83358F]/12 to-[#ff5c8a]/10 blur-[16px]" />
          <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain will-change-transform" draggable={false} />
          {/* Brilho sutil interno */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-60 dark:from-white/[0.06]"
            style={{ clipPath: 'inset(0 round 8px)' }}
          />
        </motion.div>
        {ready && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-full bg-gradient-to-br from-[#ff5c8a]/22 via-[#83358F]/18 to-transparent blur-[14px] will-change-transform"
              style={{ width: iconW * 1.5, height: iconH * 1.5 }}
              initial={{ opacity: 0, x: oX - iconW * 0.25, y: oY - iconH * 0.25, scale: 0.92 }}
              animate={{ opacity: [0, 0, 0.9, 0.9, 0.75], scale: [0.92, 0.92, 1, 1, 1], x: [oX - iconW * 0.25, oX - iconW * 0.25, oX - iconW * 0.25, oX - iconW * 0.25, finalX - iconW * 0.25], y: [oY - iconH * 0.25, oY - iconH * 0.25, oY - iconH * 0.25, oY - iconH * 0.25, finalY - iconH * 0.25] }}
              transition={{ duration: 2.8, times: [0, 0.32, 0.42, 0.62, 1], ease: 'linear' }}
            />
            <motion.div
              aria-hidden="true"
              className="logo-invert absolute left-0 top-0 will-change-transform drop-shadow-[0_0_14px_rgba(255,92,138,0.35)]"
              style={{ width: iconW, height: iconH }}
              initial={{ opacity: 0, x: oX, y: oY, scale: 0.92, filter: 'blur(4px)' as any }}
              animate={{
                opacity: [0, 0, 1, 1, 1],
                scale: [0.92, 0.92, 1, 1, 1],
                filter: ['blur(4px)', 'blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'] as any,
                x: [oX, oX, oX, oX, finalX],
                y: [oY, oY, oY, oY, finalY],
              } as any}
              transition={{ duration: 2.8, times: [0, 0.32, 0.42, 0.62, 1], ease: 'linear' as any }}
            >
              <RobotCycler className="h-full w-full" intervalMs={1550} fadeMs={700} />
            </motion.div>
          </>
        )}
        {/* Sombra ambiente suave sob o conjunto, como AcrylicPlate */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="pointer-events-none absolute -bottom-6 left-1/2 h-8 w-[62%] -translate-x-1/2 rounded-full bg-black/10 blur-[18px] dark:bg-black/25"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 3.35 }}
        className="pointer-events-none absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-3"
      >
        <span className="h-px w-10 bg-gradient-to-r from-transparent via-[#ff5c8a]/30 to-transparent" aria-hidden="true" />
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/35">
          <span className="animate-scroll-hint grid place-items-center text-ink/25" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          Clique ou role para continuar
        </span>
      </motion.div>
    </motion.div>
  );
}
