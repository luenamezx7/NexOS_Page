'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown } from 'lucide-react';
import { WavesBackground } from '@/components/ui/waves-background';
import { Slipstream } from '@/components/ui/background-ascii-flow';
import { useScrollContext } from '@/components/SmoothScrollProvider';
import { useTheme } from '@/components/ThemeProvider';
import GlyphPortal from '@/components/ui/glyph-portal';

const Topography = dynamic(() => import('@/components/ui/Topography'), { ssr: false });
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

interface WavesEntranceProps { replay: boolean; onComplete: (entered: boolean) => void }

/** Scroll-only presentation. The real, server-rendered hero is underneath it. */
export default function WavesEntrance({ replay, onComplete }: WavesEntranceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const completedRef = useRef(false);
  const presentationActiveRef = useRef(false);
  const touchYRef = useRef(0);
  const pendingScrollRef = useRef(0);
  const pendingEndRef = useRef(false);
  const inputRafRef = useRef(0);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [face, setFace] = useState<string | null>(null);
  const mobile = useSyncExternalStore(subscribeMobile, () => matchMedia('(max-width: 767px)').matches, () => false);
  const reduce = useSyncExternalStore(subscribeReduced, () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => false);
  const { lenis } = useScrollContext();
  const { theme } = useTheme();

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
    const reload = document.documentElement.dataset.nexosEntryReload === '1';
    delete document.documentElement.dataset.nexosEntryReload;
    // Direct section links still work, but a full reload always opens the presentation.
    if (!replay && window.location.hash && !reload) {
      dialog.close();
      document.dispatchEvent(new Event('nexos-entry-change'));
      const raf = requestAnimationFrame(() => onComplete(false));
      return () => cancelAnimationFrame(raf);
    }
    delete document.documentElement.dataset.nexosEntrySkip;
    dialog.close();
    dialog.showModal();
    presentationActiveRef.current = true;
    dialog.focus({ preventScroll: true });
    document.dispatchEvent(new Event('nexos-entry-change'));
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    const startRaf = requestAnimationFrame(() => setActive(true));
    return () => {
      cancelAnimationFrame(startRaf);
      cancelAnimationFrame(inputRafRef.current);
      clearTimeout(exitTimerRef.current);
      presentationActiveRef.current = false;
      dialog.close();
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.dispatchEvent(new Event('nexos-entry-change'));
    };
  }, [onComplete, replay]);

  useEffect(() => {
    if (!active || !lenis) return;
    lenis.stop();
    lenis.scrollTo(0, { immediate: true, force: true });
    return () => { lenis.start(); };
  }, [active, lenis]);

  const prepareHero = useCallback(() => {
    if (window.scrollY !== 0) {
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [lenis]);

  const revealHero = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimeout(exitTimerRef.current);
    prepareHero();
    dialogRef.current?.close();
    onComplete(true);
  }, [onComplete, prepareHero]);

  const finishWithoutZoom = useCallback(() => {
    if (completedRef.current || leaving) return;
    prepareHero();
    if (reduce) { revealHero(); return; }
    setLeaving(true);
    // Geometry/font fallback never waits for a renderer acknowledgement.
    exitTimerRef.current = setTimeout(revealHero, 500);
  }, [leaving, prepareHero, reduce, revealHero]);

  const portalProgress = useCallback((progress: number) => {
    if (!presentationActiveRef.current || completedRef.current) return;
    prepareHero();
    // The scene and word are already fully transparent at .68. Hand off in the
    // same visual interval, instead of keeping an empty scroll tail until .92.
    if (progress >= 0.70) revealHero();
  }, [prepareHero, revealHero]);

  const queueScroll = useCallback((delta: number, end = false) => {
    if (completedRef.current) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (reduce) { if (delta > 0 || end) finishWithoutZoom(); return; }
    const portal = dialog.querySelector<HTMLElement>('[data-gp-transparent]');
    if (portal?.dataset.gpMotion === 'on') {
      const amount = delta + pendingScrollRef.current;
      const atEnd = end || pendingEndRef.current;
      pendingScrollRef.current = 0; pendingEndRef.current = false;
      if (atEnd) dialog.scrollTo({ top: dialog.scrollHeight - dialog.clientHeight, behavior: 'smooth' });
      else dialog.scrollBy({ top: amount, behavior: 'smooth' });
      return;
    }
    if (delta <= 0 && !end && !pendingScrollRef.current && !pendingEndRef.current) return;
    pendingScrollRef.current = Math.min(dialog.clientHeight * 0.35, pendingScrollRef.current + Math.max(0, delta));
    pendingEndRef.current ||= end;
    if (!face || inputRafRef.current) return;
    inputRafRef.current = requestAnimationFrame(() => {
      inputRafRef.current = 0;
      const ready = dialog.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion === 'on';
      if (!ready) finishWithoutZoom();
      else {
        const amount = pendingScrollRef.current;
        const atEnd = pendingEndRef.current;
        pendingScrollRef.current = 0; pendingEndRef.current = false;
        if (atEnd) dialog.scrollTo({ top: dialog.scrollHeight - dialog.clientHeight, behavior: 'smooth' });
        else dialog.scrollBy({ top: amount, behavior: 'smooth' });
      }
    });
  }, [face, finishWithoutZoom, reduce]);

  useEffect(() => {
    if (!face || (!pendingScrollRef.current && !pendingEndRef.current)) return;
    const raf = requestAnimationFrame(() => queueScroll(0, pendingEndRef.current));
    return () => cancelAnimationFrame(raf);
  }, [face, queueScroll]);

  return <>
    <noscript><style>{`.waves-entry { display: none !important; }`}</style></noscript>
    <dialog ref={dialogRef} open tabIndex={-1} className="waves-entry" data-portal="true"
      data-leaving={leaving ? 'true' : undefined} data-replay={replay ? 'true' : undefined}
      data-lenis-prevent aria-label="Apresentação NexOS" aria-describedby="waves-entry-title waves-entry-scroll-hint"
      onCancel={event => event.preventDefault()}
      onWheel={event => {
        if (dialogRef.current?.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion !== 'on') queueScroll(event.deltaY);
      }}
      onTouchStart={event => { touchYRef.current = event.touches[0]?.clientY ?? 0; }}
      onTouchMove={event => {
        const y = event.touches[0]?.clientY ?? touchYRef.current;
        const delta = touchYRef.current - y; touchYRef.current = y;
        if (delta > 8 && dialogRef.current?.querySelector<HTMLElement>('[data-gp-transparent]')?.dataset.gpMotion !== 'on') queueScroll(delta);
      }}
      onTransitionEnd={event => { if (leaving && event.target === event.currentTarget && event.propertyName === 'opacity') revealHero(); }}
      onKeyDown={event => {
        if (event.key === 'Tab') { event.preventDefault(); dialogRef.current?.focus({ preventScroll: true }); }
        else if (['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
          event.preventDefault();
          if (event.key === 'Home') dialogRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          else queueScroll((dialogRef.current?.clientHeight ?? 600) * (event.key.includes('Up') ? -0.4 : 0.4), event.key === 'End');
        }
      }}>
      <GlyphPortal word={PHRASE} lines={mobile ? MOBILE_LINES : DESKTOP_LINES}
        focusChar="N" interactive={false} annotations={false} transparentReveal showEnterLink={false}
        enabled={Boolean(face) && !reduce} fontFamily={face ?? '"Satoshi", Arial, sans-serif'} fontWeight={900}
        scrollLength={1.5} className="waves-entry-portal"
        style={{ '--gp-paper': 'transparent', '--gp-ink': 'var(--entry-ink)', '--gp-field': 'transparent', '--gp-foreground': 'var(--entry-ink)' }}
        onProgress={portalProgress}
        background={<>
          {theme === 'dark' ? <WavesBackground active={active} paused={leaving} /> : <Topography
            lowColor="#2470b3" midColor="#86cbf9" highColor="#ffffff" lightMode
            active={active} paused={leaving} mouseInteraction maxFPS={24} dprLimit={1.25}
            className="waves-entry-topography" />}
          <div className="waves-entry-stars" aria-hidden="true"><Slipstream presentation interactive={false} paused={leaving} density={1.3} seed={731} /></div>
          <div className="waves-entry-scrim" aria-hidden="true" />
        </>}
        front={<div className="waves-entry-content">
          <h2 id="waves-entry-title" className="waves-entry-title"><span>Nexos, a performance</span>{' '}<span>que seu business merece.</span></h2>
          <p id="waves-entry-scroll-hint" className="waves-entry-instruction"><ChevronDown aria-hidden="true" />{mobile ? 'Arraste para continuar' : 'Role para continuar'}</p>
        </div>}><span aria-hidden="true" /></GlyphPortal>
    </dialog>
  </>;
}
