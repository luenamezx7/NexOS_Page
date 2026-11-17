'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandWordmark } from './BrandWordmark';
import { useScrollContext } from './SmoothScrollProvider';
import styles from './BrandEntrance.module.css';
import { useLocale } from '@/lib/locale';
import { recordMotion } from '@/lib/motion-diagnostics';

interface BrandEntranceProps {
  onComplete: (entered: boolean) => void;
}

/** Server-rendered cover prevents the hero flashing before the opening fade. */
export default function BrandEntrance({ onComplete }: BrandEntranceProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const exitRef = useRef<(() => void) | null>(null);
  const completeRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<'pending' | 'entering' | 'leaving'>('pending');
  const [progress, setProgress] = useState(0);
  const { lenis } = useScrollContext();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      onComplete(true);
      return;
    }
    let disposed = false;
    let completed = false;
    let leaving = false;
    let started = false;
    let frame = 0;
    let progressFrame = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const computed = getComputedStyle(dialog);
    // The CSS compiler may normalize 1850ms to 1.85s. Preserve the unit.
    const durationInMs = (property: string, fallback: number) => {
      const value = computed.getPropertyValue(property).trim();
      const amount = parseFloat(value);
      if (!Number.isFinite(amount) || amount <= 0) return fallback;
      return value.endsWith('ms') ? amount : value.endsWith('s') ? amount * 1000 : fallback;
    };
    const duration = durationInMs('--entry-duration', 1850);
    const exitDuration = durationInMs('--exit-duration', 800);
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const notify = () => document.dispatchEvent(new Event('nexos-entry-change'));
    const later = (callback: () => void, ms: number) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, ms);
      timers.add(timer);
      return timer;
    };
    const complete = () => {
      if (disposed || completed) return;
      completed = true;
      recordMotion('presentation', 'completed');
      dialog.close();
      notify();
      onComplete(true);
    };
    const beginExit = () => {
      if (disposed || completed || leaving) return;
      leaving = true;
      recordMotion('presentation', 'leaving');
      cancelAnimationFrame(progressFrame);
      setProgress(100);
      // Give the hero two paints to settle before the opaque cover starts fading.
      dialog.dataset.revealing = 'true';
      notify();
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (disposed) return;
          setPhase('leaving');
          later(complete, exitDuration);
        });
      });
    };
    const start = () => {
      if (disposed || completed || leaving || started) return;
      started = true;
      setPhase('entering');
      recordMotion('presentation', 'entering', `effectiveMotion=full; durationMs=${duration}`);
      // Begin at the first paint, after hydration's synchronous work. Limit
      // frame gaps so a busy frame cannot skip a visible part of the counter.
      let previousFrame: number | null = null;
      let elapsed = 0;
      const tick = (now: number) => {
        if (disposed || leaving) return;
        if (previousFrame !== null) elapsed += Math.min(64, Math.max(0, now - previousFrame));
        previousFrame = now;
        if (elapsed >= duration) {
          beginExit();
          return;
        }
        setProgress(Math.min(99, Math.floor(elapsed / duration * 100)));
        progressFrame = requestAnimationFrame(tick);
      };
      progressFrame = requestAnimationFrame(tick);
    };

    exitRef.current = beginExit;
    completeRef.current = complete;
    dialog.close();
    dialog.showModal();
    recordMotion('presentation', 'open');
    dialog.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    notify();

    // Never wait for fonts or a shader before showing movement.
    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(progressFrame);
      timers.forEach(clearTimeout);
      exitRef.current = null;
      completeRef.current = null;
      dialog.close();
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      notify();
    };
  }, [onComplete]);

  useEffect(() => {
    if (!lenis) return;
    lenis.stop();
    lenis.scrollTo(0, { immediate: true, force: true });
    return () => { lenis.start(); };
  }, [lenis]);

  return <>
    <noscript><style>{'[data-presentation] { display: none !important; }'}</style></noscript>
    <dialog
      ref={dialogRef}
      open
      tabIndex={-1}
      data-presentation
      data-phase={phase}
      data-lenis-prevent
       aria-label={t('Apresentação ezway')}
      className={styles.dialog}
      onCancel={event => { event.preventDefault(); exitRef.current?.(); }}
      onTransitionEnd={event => {
        if (phase === 'leaving' && event.target === event.currentTarget && event.propertyName === 'opacity') completeRef.current?.();
      }}
    >
      <div className={styles.stage}>
        <div className={styles.frame}>
          <BrandWordmark animated />
          <span className={styles.progressNumber} role="progressbar" aria-label={t('Preparando a página')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} data-presentation-percentage data-presentation-progress>{progress}%</span>
        </div>
      </div>
       <button type="button" className={styles.skip} onClick={() => exitRef.current?.()}>{t('Pular apresentação')} <span aria-hidden="true">↗</span></button>
    </dialog>
  </>;
}
