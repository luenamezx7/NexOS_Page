'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RobotCycler } from './RobotCycler';
import { useTheme } from './ThemeProvider';

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

  const logoSrc = theme === 'dark' ? '/nexos-logo-dark.svg' : '/nexos-logo-light.svg';

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
        initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[850] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4"
        onClick={finish}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_75%_at_50%_50%,rgba(255,92,138,0.10),rgba(131,53,143,0.08)_32%,transparent_72%)]"
        />
        <div className="relative flex w-full max-w-2xl items-center justify-center gap-4 md:gap-8">
          <div ref={logoRef} className="relative" style={{ width: 'min(55vw, 460px)', aspectRatio: '1433 / 344' }}>
            <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain" draggable={false} width={1433} height={344} />
          </div>
          <RobotCycler className="logo-invert shrink-0" style={{ width: iconW || 60, height: iconH || 50 }} intervalMs={1600} fadeMs={600} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="region" aria-label="NexOS"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[850] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas"
      onClick={finish}
    >
      {/* A marca mantém o mesmo tema durante toda a entrada. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_75%_at_50%_50%,rgba(255,92,138,0.11),rgba(131,53,143,0.09)_30%,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-[16px] border-canvas sm:border-[32px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 bottom-24 h-px bg-ink/10 sm:inset-x-12"
      />

      {/* Conjunto central — logo + ícone */}
      <div className="relative flex items-center justify-center" style={{ width: 'min(66vw, 540px)' }}>
        <motion.div
          ref={logoRef}
          className="relative"
          style={{ width: '100%', aspectRatio: '1433 / 344' }}
          initial={{ opacity: 0, y: 12, x: 0 }}
          animate={inView ? { opacity: 1, y: 0, x: ready ? logoShift : 0 } : { opacity: 0, y: 12, x: 0 }}
          transition={{
            opacity: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
            x: { duration: 0.95, ease: [0.45, 0, 0.2, 1], delay: 1.85 },
          }}
        >
          <img src={logoSrc} alt="NexOS" className="h-full w-full object-contain will-change-transform" draggable={false} width={1433} height={344} />
        </motion.div>
        {ready && (
          <motion.div
            aria-hidden="true"
            className="logo-invert absolute left-0 top-0"
            style={{ width: iconW, height: iconH }}
            initial={{ opacity: 0, x: oX, y: oY, scale: 0.92 }}
            animate={{
              opacity: [0, 0, 1, 1, 1],
              scale: [0.92, 0.92, 1, 1, 1],
              x: [oX, oX, oX, oX, finalX],
              y: [oY, oY, oY, oY, finalY],
            }}
            transition={{ duration: 2.8, times: [0, 0.32, 0.42, 0.62, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <RobotCycler className="h-full w-full" intervalMs={1550} fadeMs={700} />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 3.35 }}
        className="pointer-events-none absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-3"
      >
        <span className="h-px w-10 bg-ink/20" aria-hidden="true" />
        <span className="flex items-center gap-2 text-sm text-ink/70">
          <span className="animate-scroll-hint grid place-items-center" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          Clique ou role para continuar
        </span>
      </motion.div>
    </motion.div>
  );
}
