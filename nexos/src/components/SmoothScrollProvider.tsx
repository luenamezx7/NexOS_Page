'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';
import { sectionScrollPosition } from '@/lib/section-position';
import { PRESENTATION_SELECTOR } from '@/lib/use-presentation-active';

type SectionScrollOptions = { immediate?: boolean; history?: 'push' | 'none'; focus?: boolean };
type SectionScroll = (hash: string, options?: SectionScrollOptions) => boolean;
interface ScrollContextValue { isScrolling: boolean; lenis: Lenis | null; scrollToSection: SectionScroll }
const ScrollContext = createContext<ScrollContextValue>({ isScrolling: false, lenis: null, scrollToSection: () => false });
export function useScrollContext() { return useContext(ScrollContext); }
export function useSectionScroll() { return useScrollContext().scrollToSection; }

/** One navigation controller for links, section buttons, native scroll and Lenis. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const cancelNavigationRef = useRef<(() => void) | null>(null);
  const userInteractedRef = useRef(false);
  const navigationPathRef = useRef(pathname);

  const scrollToSection = useCallback<SectionScroll>((hash, options = {}) => {
    let id: string;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return false; }
    const target = document.getElementById(id);
    if (!target || document.querySelector('dialog[open]') || lenis?.isStopped) return false;
    // A replayed hydration click may arrive before the document capture listener mounts.
    // Mark it here so the initial hash-restoration effect cannot cancel this navigation.
    if (options.history !== 'none') userInteractedRef.current = true;
    cancelNavigationRef.current?.();
    let cancelled = false;
    let raf = 0;
    const immediate = options.immediate || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (options.history !== 'none' && window.location.hash !== `#${id}`) {
      history.pushState(history.state, '', `#${encodeURIComponent(id)}`);
    }
    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (lenis && !lenis.isStopped) lenis.scrollTo(window.scrollY, { immediate: true });
      else window.scrollTo({ top: window.scrollY, behavior: 'instant' });
    };
    cancelNavigationRef.current = cancel;
    const finish = () => {
      if (cancelled || !target.isConnected) return;
      // Resize once after travel so late-loaded sections cannot leave a stale limit.
      lenis?.resize();
      const y = sectionScrollPosition(target);
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo({ top: y, behavior: 'instant' });
      cancelNavigationRef.current = null;
      if (options.focus !== false) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
        target.focus({ preventScroll: true });
      }
    };
    const y = sectionScrollPosition(target);
    if (immediate) {
      finish();
    } else if (lenis) {
      lenis.resize();
      lenis.scrollTo(y, { duration: 1, onComplete: finish });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
      const start = performance.now();
      const settle = (now: number) => {
        if (cancelled) return;
        if (Math.abs(window.scrollY - y) < 2 || now - start > 2500) finish();
        else raf = requestAnimationFrame(settle);
      };
      raf = requestAnimationFrame(settle);
    }
    return true;
  }, [lenis]);

  useEffect(() => {
    const media = matchMedia('(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let disposed = false, instance: Lenis | null = null, raf = 0, scrolling = false, generation = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function stop() {
      generation += 1;
      cancelAnimationFrame(raf); raf = 0; clearTimeout(timeout);
      instance?.destroy(); instance = null;
      setLenis(null); if (scrolling) setIsScrolling(false); scrolling = false;
    }
    function frame(time: number) {
      raf = 0;
      if (disposed || !instance || document.hidden) return;
      instance.raf(time);
      raf = requestAnimationFrame(frame);
    }
    async function setup() {
      stop();
      if (pathname !== '/' || !media.matches || disposed) return;
      const current = generation;
      const { default: Lenis } = await import('lenis');
      if (disposed || !media.matches || current !== generation) return;
      // Anchor handling belongs to the shared controller, never two scroll systems.
      instance = new Lenis({ duration: 1, lerp: 0.08, wheelMultiplier: 1, infinite: false, anchors: false });
      setLenis(instance);
      instance.on('scroll', () => {
        if (!scrolling) { scrolling = true; setIsScrolling(true); }
        clearTimeout(timeout);
        timeout = setTimeout(() => { scrolling = false; setIsScrolling(false); }, 150);
      });
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    function visibility() {
      cancelAnimationFrame(raf); raf = 0;
      // Preserve the controller and any modal lock when returning to this tab.
      if (!document.hidden && instance) {
        instance.resize();
        raf = requestAnimationFrame(frame);
      }
    }
    void setup();
    media.addEventListener('change', setup);
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; stop(); media.removeEventListener('change', setup); document.removeEventListener('visibilitychange', visibility); };
  }, [pathname]);

  useEffect(() => {
    let restoreRaf = 0;
    let disposed = false;
    if (navigationPathRef.current !== pathname) {
      navigationPathRef.current = pathname;
      userInteractedRef.current = false;
    }
    const cancel = () => {
      cancelAnimationFrame(restoreRaf);
      cancelNavigationRef.current?.();
      cancelNavigationRef.current = null;
    };
    const interrupt = () => { userInteractedRef.current = true; cancel(); };
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) interrupt();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
      if (anchor) { userInteractedRef.current = true; cancelAnimationFrame(restoreRaf); }
      if (!anchor || anchor.closest('[data-managed-section-links]') || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      // Capture before Next Link's own hash handling to avoid competing scrolls.
      if (scrollToSection(url.hash)) event.preventDefault();
    };
    const restoreHash = () => {
      cancelAnimationFrame(restoreRaf);
      // Back/forward can happen before Lenis calls the previous trip's onComplete.
      // Stop that trip before measuring or restoring the new history destination.
      cancelNavigationRef.current?.();
      cancelNavigationRef.current = null;
      if (!location.hash || document.querySelector(PRESENTATION_SELECTOR)) return;
      const started = performance.now();
      let stable = 0, previous = -1;
      const waitForLayout = () => {
        if (disposed) return;
        if (document.querySelector(PRESENTATION_SELECTOR)) return;
        let target: HTMLElement | null = null;
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
        const top = target ? sectionScrollPosition(target) : -1;
        stable = top >= 0 && top === previous ? stable + 1 : 0;
        previous = top;
        if (target && stable >= 3 && (document.fonts.status === 'loaded' || performance.now() - started > 800)) {
          scrollToSection(location.hash, { immediate: true, history: 'none', focus: false });
        } else if (performance.now() - started < 3000) restoreRaf = requestAnimationFrame(waitForLayout);
      };
      restoreRaf = requestAnimationFrame(waitForLayout);
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('wheel', interrupt, { passive: true, capture: true });
    window.addEventListener('touchstart', interrupt, { passive: true, capture: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', restoreHash);
    window.addEventListener('popstate', restoreHash);
    // The browser already places #hero at the top before hydration. Restoring it
    // again after fonts load can undo the visitor's first native wheel gesture.
    if (!userInteractedRef.current && location.hash !== '#hero') restoreHash();
    return () => {
      disposed = true; cancel(); cancelAnimationFrame(restoreRaf);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('wheel', interrupt, true);
      window.removeEventListener('touchstart', interrupt, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', restoreHash);
      window.removeEventListener('popstate', restoreHash);
    };
  }, [pathname, scrollToSection]);

  return <ScrollContext.Provider value={{ isScrolling, lenis, scrollToSection }}><div className={isScrolling ? 'is-scrolling' : undefined}>{children}</div></ScrollContext.Provider>;
}
