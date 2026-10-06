'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WavesBackground } from '@/components/ui/waves-background';
import { Slipstream } from '@/components/ui/background-ascii-flow';
import { useScrollContext } from '@/components/SmoothScrollProvider';
import GlyphPortal from '@/components/ui/glyph-portal';

const PHRASE = 'Nexos, a performance que seu business merece.';
const DESKTOP_LINES = ['Nexos, a performance', 'que seu business merece.'];
const MOBILE_LINES = ['Nexos, a', 'performance', 'que seu', 'business merece.'];
function subscribeMobile(callback: () => void) {
  const query = matchMedia('(max-width: 767px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function subscribeReduced(callback: () => void) {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

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
  const presentationActiveRef = useRef(false);
  const progressRef = useRef(0);
  const touchYRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [face, setFace] = useState<string | null>(null);
  const mobile = useSyncExternalStore(subscribeMobile, () => matchMedia('(max-width: 767px)').matches, () => false);
  const reduce = useSyncExternalStore(subscribeReduced, () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => false);
  const { lenis } = useScrollContext();

  useEffect(() => {
    let disposed = false, settled = false;
    const choose = (family: string) => { if (!disposed && !settled) { settled = true; setFace(family); } };
    const timer = setTimeout(() => choose('"Arial Black", Arial, sans-serif'), 1600);
    void document.fonts.load('900 100px "Satoshi"', PHRASE).then(
      () => choose('"Satoshi", Arial, sans-serif'),
      () => choose('"Arial Black", Arial, sans-serif'),
    );
    return () => { disposed = true; clearTimeout(timer); };
  }, []);

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
    presentationActiveRef.current = true;
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
      presentationActiveRef.current = false;
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

  const revealHero = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    leavingRef.current = true;
    clearTimeout(timerRef.current);
    try { sessionStorage.setItem('nexos-boot-seen', '1'); } catch { /* Storage is optional. */ }
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    dialogRef.current?.close();
    onComplete(true);
  }, [lenis, onComplete]);

  const portalProgress = useCallback((progress: number) => {
    if (!presentationActiveRef.current || completedRef.current) return;
    progressRef.current = progress;
    if (progress === 0) {
      // The real hero is the portal's destination, including a replay from the footer.
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (progress > 0.04 && document.activeElement === buttonRef.current) {
      buttonRef.current?.blur();
      dialogRef.current?.focus({ preventScroll: true });
    }
    if (progress >= 0.92 && !leavingRef.current) revealHero();
  }, [lenis, revealHero]);

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

  const enter = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || leavingRef.current) return;
    const portal = dialog.querySelector<HTMLElement>('[data-gp-transparent]');
    if (reduce || portal?.dataset.gpMotion !== 'on') { finish(); return; }
    dialog.scrollTo({ top: dialog.scrollHeight - dialog.clientHeight, behavior: 'smooth' });
  }, [finish, reduce]);

  return (
    <>
      <noscript><style>{`.waves-entry { display: none !important; }`}</style></noscript>
      <dialog
        ref={dialogRef}
        open
        tabIndex={-1}
        className="waves-entry"
        data-portal="true"
        data-leaving={leaving ? 'true' : undefined}
        data-replay={replay ? 'true' : undefined}
        data-lenis-prevent
        aria-label="Apresentação NexOS"
        aria-describedby="waves-entry-title"
        onCancel={event => { event.preventDefault(); finish(); }}
        onWheel={event => {
          if (Math.abs(event.deltaY) > 12 && dialogRef.current?.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion !== 'on') finish();
        }}
        onTouchStart={event => { touchYRef.current = event.touches[0]?.clientY ?? 0; }}
        onTouchMove={event => {
          if (Math.abs((event.touches[0]?.clientY ?? touchYRef.current) - touchYRef.current) > 30 && dialogRef.current?.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion !== 'on') finish();
        }}
        onTransitionEnd={event => {
          if (event.target === event.currentTarget && event.propertyName === 'opacity') completeExit();
        }}
        onKeyDown={event => {
          if (event.key === 'Tab') {
            event.preventDefault();
            if (progressRef.current > 0.08) enter();
            else buttonRef.current?.focus({ preventScroll: true });
          } else if (['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            if (event.key === 'End') enter();
            else if (reduce || dialogRef.current?.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion !== 'on') finish();
            else if (event.key === 'Home') dialogRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            else dialogRef.current?.scrollBy({ top: dialogRef.current.clientHeight * (event.key.includes('Up') ? -0.4 : 0.4), behavior: 'smooth' });
          }
        }}
      >
        <GlyphPortal
          word={PHRASE} lines={mobile ? MOBILE_LINES : DESKTOP_LINES}
          focusChar="N" interactive={false} annotations={false} transparentReveal
          enabled={Boolean(face) && !reduce} fontFamily={face ?? '"Satoshi", Arial, sans-serif'} fontWeight={900}
          scrollLength={1.5} enterLabel="Entrar no site" className="waves-entry-portal"
          style={{ '--gp-paper': 'transparent', '--gp-ink': '#fff3fa', '--gp-field': 'transparent', '--gp-foreground': '#fff3fa' }}
          onProgress={portalProgress}
          background={<>
            <WavesBackground active={active} paused={freezing} onPaused={beginExit} />
            <div className="waves-entry-stars" aria-hidden="true"><Slipstream presentation interactive={false} paused={freezing} density={1.3} seed={731} /></div>
            <div className="waves-entry-scrim" aria-hidden="true" />
          </>}
          front={<div className="waves-entry-content">
            <h2 id="waves-entry-title" className="waves-entry-title"><span>Nexos, a performance</span>{' '}<span>que seu business merece.</span></h2>
            <div className="waves-entry-portal-action">
              <Button ref={buttonRef} variant="inverse" size="lg" onClick={enter} aria-busy={freezing} aria-label="Continuar para o site" className="waves-entry-action">
                Entrar no site <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </div>}
        ><span aria-hidden="true" /></GlyphPortal>
      </dialog>
    </>
  );
}
