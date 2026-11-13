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
    let disposed = false;
    let completed = false;
    let leaving = false;
    let started = false;
    let frame = 0;
    let progressFrame = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    // CSS already animates the server HTML, even while client chunks are loading.
    const cover = dialog.getAnimations().find(animation => (animation as CSSAnimation).animationName?.includes('brand-cover-lifetime'));
    const elapsedAtHydration = Math.max(0, Number(cover?.currentTime ?? 0));
    const coverExpired = getComputedStyle(dialog).visibility === 'hidden';
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
          later(complete, Math.max(0, Math.min(850, 2700 - elapsedAtHydration)));
        });
      });
    };
    const start = () => {
      if (disposed || completed || leaving || started) return;
      started = true;
      setPhase('entering');
      const duration = 1850;
      recordMotion('presentation', 'entering', `effectiveMotion=full; durationMs=${duration}; elapsedBeforeHydrationMs=${Math.round(elapsedAtHydration)}`);
      const startTime = performance.now() - elapsedAtHydration;
      let lastProgressPaint = 0;
      const tick = (now: number) => {
        if (disposed || leaving) return;
        if (now - lastProgressPaint >= 80) {
          setProgress(Math.max(0, Math.min(99, Math.floor((now - startTime) / duration * 100))));
          lastProgressPaint = now;
        }
        progressFrame = requestAnimationFrame(tick);
      };
      progressFrame = requestAnimationFrame(tick);
      later(beginExit, Math.max(0, duration - elapsedAtHydration));
    };

    exitRef.current = beginExit;
    completeRef.current = complete;
    dialog.close();
    if (elapsedAtHydration >= 2700 || coverExpired) {
      recordMotion('presentation', 'completed-before-hydration');
      onComplete(true);
      return;
    }
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
          <span className={styles.progressNumber} data-presentation-percentage aria-hidden="true">{progress}%</span>
        </div>
      </div>
      <div className={styles.progress} role="progressbar" aria-label={t('Preparando a página')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} data-presentation-progress>
        <div className={styles.progressDetails} aria-hidden="true">{t('Preparando a página')}</div>
        <div className={styles.progressTrack} aria-hidden="true"><span className={styles.progressFill} style={{ transform: `scaleX(${progress / 100})` }} /></div>
      </div>
       <button type="button" className={styles.skip} onClick={() => exitRef.current?.()}>{t('Pular apresentação')} <span aria-hidden="true">↗</span></button>
    </dialog>
  </>;
}
