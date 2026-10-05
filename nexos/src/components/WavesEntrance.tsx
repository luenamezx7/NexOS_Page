'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WavesBackground } from '@/components/ui/waves-background';
import { Slipstream } from '@/components/ui/background-ascii-flow';
import { useScrollContext } from '@/components/SmoothScrollProvider';

interface WavesEntranceProps {
  replay: boolean;
  onComplete: (entered: boolean) => void;
}

/** Native top-layer entry screen; the commercial home is always server-rendered. */
export default function WavesEntrance({ replay, onComplete }: WavesEntranceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leavingRef = useRef(false);
  const exitStartedRef = useRef(false);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const { lenis } = useScrollContext();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let seen = false;
    try { seen = sessionStorage.getItem('nexos-boot-seen') === '1'; } catch { /* Storage can be disabled. */ }
    if (!replay && (seen || window.location.hash)) {
      dialog.close();
      document.dispatchEvent(new Event('nexos-entry-change'));
      if (!window.location.hash && (dialog.contains(document.activeElement) || document.activeElement === document.body)) {
        // The SSR preview must not move the starting point of keyboard navigation.
        const previousTabIndex = document.body.getAttribute('tabindex');
        document.body.tabIndex = -1;
        document.body.focus({ preventScroll: true });
        if (previousTabIndex === null) document.body.removeAttribute('tabindex');
        else document.body.setAttribute('tabindex', previousTabIndex);
      }
      // Avoid forcing hydration of the entire home synchronously from a layout effect.
      const skipRaf = requestAnimationFrame(() => onComplete(false));
      return () => cancelAnimationFrame(skipRaf);
    }
    // Convert the SSR non-modal preview to a native modal before the client paint.
    // Native dialog owns focus containment, inert siblings, Escape and top-layer stacking.
    dialog.close();
    dialog.showModal();
    document.dispatchEvent(new Event('nexos-entry-change'));
    buttonRef.current?.focus({ preventScroll: true });
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const startRaf = requestAnimationFrame(() => {
      if (!leavingRef.current) setActive(true);
    });
    return () => {
      cancelAnimationFrame(startRaf);
      clearTimeout(timerRef.current);
      dialog.close();
      document.dispatchEvent(new Event('nexos-entry-change'));
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [onComplete, replay]);

  useEffect(() => {
    if (!active || !lenis) return;
    lenis.stop();
    return () => { lenis.start(); };
  }, [active, lenis]);

  const completeExit = useCallback(() => {
    if (!leavingRef.current || completedRef.current) return;
    completedRef.current = true;
    clearTimeout(timerRef.current);
    dialogRef.current?.close();
    onComplete(true);
  }, [onComplete]);

  const beginExit = useCallback(() => {
    if (!leavingRef.current || exitStartedRef.current) return;
    exitStartedRef.current = true;
    setLeaving(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      completeExit();
      return;
    }
    const duration = parseFloat(getComputedStyle(dialogRef.current!).transitionDuration) * 1000;
    // Completion follows the compositor's transitionend, not a competing timer.
    timerRef.current = setTimeout(completeExit, duration + 3000);
  }, [completeExit]);

  const finish = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try { sessionStorage.setItem('nexos-boot-seen', '1'); } catch { /* Entry remains usable without storage. */ }
    // Prepare the destination while the entry still covers it, including replays
    // opened from the footer. Never jump the page after the crossfade is visible.
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Freeze the last shader frame, but keep its worker/buffer alive throughout
    // the fade so the compositor has room to animate without flashing the canvas.
    // Wait for the renderer's acknowledgement before starting the visual fade.
    setFreezing(true);
  }, [lenis]);

  return (
    <>
      <noscript><style>{`.waves-entry { display: none !important; }`}</style></noscript>
      <dialog
        ref={dialogRef}
        open
        className="waves-entry"
        data-leaving={leaving ? 'true' : undefined}
        data-replay={replay ? 'true' : undefined}
        data-lenis-prevent
        aria-label="Apresentação NexOS"
        aria-describedby="waves-entry-title"
        onCancel={event => { event.preventDefault(); finish(); }}
        onTransitionEnd={event => {
          if (event.target === event.currentTarget && event.propertyName === 'opacity') completeExit();
        }}
        onKeyDown={event => {
          if (event.key === 'Tab') {
            event.preventDefault();
            buttonRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        <WavesBackground active={active} paused={freezing} onPaused={beginExit} />
        <div className="waves-entry-stars" aria-hidden="true">
          <Slipstream presentation interactive={false} paused={freezing} density={1.3} seed={731} />
        </div>
        <div className="waves-entry-scrim" aria-hidden="true" />
        <div className="waves-entry-content">
          <h2 id="waves-entry-title" className="waves-entry-title">
            <span>Nexos, a performance</span>{' '}
            <span>que seu business merece.</span>
          </h2>
          <Button ref={buttonRef} variant="inverse" size="lg" onClick={finish} aria-busy={freezing} aria-label="Continuar para o site" className="waves-entry-action">
            Entrar no site <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </dialog>
    </>
  );
}
