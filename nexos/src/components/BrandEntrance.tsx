'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandWordmark } from './BrandWordmark';
import { useScrollContext } from './SmoothScrollProvider';
import { raithonRealm } from '@/lib/brand-font';
import styles from './BrandEntrance.module.css';

interface BrandEntranceProps {
  onComplete: (entered: boolean) => void;
}

/** Server-rendered cover prevents the hero flashing before the opening fade. */
export default function BrandEntrance({ onComplete }: BrandEntranceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const exitRef = useRef<(() => void) | null>(null);
  const completeRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<'pending' | 'entering' | 'leaving'>('pending');
  const { lenis } = useScrollContext();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let disposed = false;
    let completed = false;
    let leaving = false;
    let started = false;
    let frame = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
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
      dialog.close();
      notify();
      onComplete(true);
    };
    const beginExit = () => {
      if (disposed || completed || leaving) return;
      leaving = true;
      // Paint and reveal the real hero underneath before dissolving the cover.
      dialog.dataset.revealing = 'true';
      notify();
      setPhase('leaving');
      later(complete, media.matches ? 180 : 850);
    };
    const start = () => {
      if (disposed || completed || leaving || started) return;
      started = true;
      frame = requestAnimationFrame(() => {
        setPhase('entering');
        later(beginExit, media.matches ? 400 : 1850);
      });
    };

    exitRef.current = beginExit;
    completeRef.current = complete;
    dialog.close();
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    notify();

    // Use the actual closing-logo font before the fade, with a bounded fallback.
    const fontDeadline = later(start, 1400);
    void document.fonts.load(`400 100px ${raithonRealm.style.fontFamily}`, 'NEXOS').then(() => {
      clearTimeout(fontDeadline);
      timers.delete(fontDeadline);
      start();
    }, start);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
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
      aria-label="Apresentação NexOS"
      className={styles.dialog}
      onCancel={event => { event.preventDefault(); exitRef.current?.(); }}
      onTransitionEnd={event => {
        if (phase === 'leaving' && event.target === event.currentTarget && event.propertyName === 'opacity') completeRef.current?.();
      }}
    >
      <div className={styles.stage}>
        <div className={styles.frame}><BrandWordmark animated /></div>
      </div>
      <button type="button" className={styles.skip} onClick={() => exitRef.current?.()}>Pular apresentação <span aria-hidden="true">↗</span></button>
    </dialog>
  </>;
}
