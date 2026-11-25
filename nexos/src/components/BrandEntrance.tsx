'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GlassIconReveal } from './ui/liquid-glass-logo-reveal';
import { presentationBootstrap } from './ui/presentation-bootstrap.generated';
import { startPresentationRuntime } from './ui/presentation-runtime';
import { mascotRevealArtwork } from './ui/mascot-reveal-artwork';
import { SilkBackground } from './auth/SilkBackground';
import { useScrollContext } from './SmoothScrollProvider';
import styles from './BrandEntrance.module.css';
import { useLocale } from '@/lib/locale';
import { recordMotion } from '@/lib/motion-diagnostics';

interface BrandEntranceProps {
  onComplete: (entered: boolean) => void;
  nonce?: string;
}

/** Server-rendered cover prevents the hero flashing before the opening fade. */
export default function BrandEntrance({ onComplete, nonce }: BrandEntranceProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const exitRef = useRef<(() => void) | null>(null);
  const completeRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<'pending' | 'entering' | 'leaving'>('pending');
  const { lenis } = useScrollContext();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (motionMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      onComplete(true);
      return;
    }
    const runtime = startPresentationRuntime(dialog);
    let disposed = false;
    let completed = false;
    let leaving = false;
    let started = false;
    let frame = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const computed = getComputedStyle(dialog);
    // The CSS compiler may normalize milliseconds to seconds. Preserve the unit.
    const durationInMs = (property: string, fallback: number) => {
      const value = computed.getPropertyValue(property).trim();
      const amount = parseFloat(value);
      if (!Number.isFinite(amount) || amount <= 0) return fallback;
      return value.endsWith('ms') ? amount : value.endsWith('s') ? amount * 1000 : fallback;
    };
    const duration = durationInMs('--entry-duration', 5000);
    const exitDuration = durationInMs('--exit-duration', 1100);
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
      later(complete, exitDuration + 500);
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
    let entryTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleEnd = () => {
      if (entryTimer) { clearTimeout(entryTimer); timers.delete(entryTimer); }
      entryTimer = later(beginExit, Math.max(0, duration - (runtime ? performance.now() - runtime.startedAt : 0)));
    };
    dialog.addEventListener('nexos-presentation-ready', scheduleEnd);
    const start = () => {
      if (disposed || completed || leaving || started) return;
      started = true;
      setPhase('entering');
      recordMotion('presentation', 'entering', `effectiveMotion=full; durationMs=${duration}`);
      // Preserve the existing wall-clock deadline, independently of GPU readiness.
      scheduleEnd();

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
      timers.forEach(clearTimeout);
      dialog.removeEventListener('nexos-presentation-ready', scheduleEnd);
      exitRef.current = null;
      completeRef.current = null;
      // Strict Mode replays effects while retaining the same DOM. Keep that
      // running renderer; dispose only when the dialog actually leaves the tree.
      queueMicrotask(() => { if (!dialog.isConnected) runtime?.dispose(); });
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
      suppressHydrationWarning
      data-phase={phase}
      data-lenis-prevent
       aria-label={t('Apresentação ezway')}
      className={styles.dialog}
      onCancel={event => { event.preventDefault(); exitRef.current?.(); }}
      onTransitionEnd={event => {
        if (phase === 'leaving' && event.target === event.currentTarget && event.propertyName === 'opacity') completeRef.current?.();
      }}
    >
      <SilkBackground />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.frame}>
          <GlassIconReveal logo="/logo-ghost.svg" fallbackMarkup={mascotRevealArtwork} cutoutLightDetails label={t('Mascote ezway')} className={styles.reveal} />
        </div>
      </div>
    </dialog>
    {/* Parser-time startup is intentional: the same engines are adopted by React. */}
    <script nonce={nonce} dangerouslySetInnerHTML={{ __html: presentationBootstrap }} />
  </>;
}
