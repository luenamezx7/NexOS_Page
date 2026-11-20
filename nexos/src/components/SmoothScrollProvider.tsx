'use client';

import { FULL_MOTION, motionMedia } from '@/lib/motion-policy';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';
import { sectionScrollPosition } from '@/lib/section-position';
import { PRESENTATION_SELECTOR } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { isEmbeddedBrowser } from '@/lib/scroll-profile';

type SectionScrollOptions = { immediate?: boolean; history?: 'push' | 'none'; focus?: boolean };
type SectionScroll = (hash: string, options?: SectionScrollOptions) => boolean;
interface ScrollContextValue { isScrolling: boolean; lenis: Lenis | null; scrollToSection: SectionScroll }
const ScrollContext = createContext<ScrollContextValue>({ isScrolling: false, lenis: null, scrollToSection: () => false });
export function useScrollContext() { return useContext(ScrollContext); }
export function useSectionScroll() { return useScrollContext().scrollToSection; }

/** One navigation controller for links, section buttons and scroll. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const wakeScrollRef = useRef<() => void>(() => {});
  const cancelNavigationRef = useRef<(() => void) | null>(null);
  const userInteractedRef = useRef(false);
  const navigationPathRef = useRef(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    let width = -1;
    const touch = matchMedia('(pointer: coarse)').matches || isEmbeddedBrowser(navigator.userAgent);
    const measure = () => {
      if (touch && width === innerWidth) return;
      width = innerWidth;
      root.style.setProperty('--page-viewport-height', `${innerHeight}px`);
      root.dataset.scrollLayout = innerHeight >= 700 ? 'tall' : 'short';
    };
    measure();
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); root.style.removeProperty('--page-viewport-height'); delete root.dataset.scrollLayout; };
  }, []);

  useLayoutEffect(() => {
    if (pathname !== '/') return;
    // The intro and section controller own the homepage's initial position.
    // Native restoration can otherwise run after the intro's one-off reset.
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let disposed = false;
    let restorePlugin: (() => void) | undefined;
    // ScrollTrigger caches this setting and reapplies it during refresh.
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      ScrollTrigger.clearScrollMemory('manual');
      restorePlugin = () => ScrollTrigger.clearScrollMemory(previous);
    }).catch(error => recordMotion('scroll', 'restoration-error', motionError(error)));
    if (!location.hash || location.hash === '#hero') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    return () => { disposed = true; restorePlugin?.(); history.scrollRestoration = previous; };
  }, [pathname]);

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
    // All devices share interruptible Lenis navigation. Before it loads, touch
    // navigation lands directly so native momentum cannot fight an anchor jump.
    const immediate = options.immediate || motionMedia('(prefers-reduced-motion: reduce)').matches || (!lenis && (motionMedia('(pointer: coarse)').matches || isEmbeddedBrowser(navigator.userAgent)));
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
      lenis.scrollTo(y, { duration: 1.4, onComplete: finish });
      wakeScrollRef.current();
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
    const root = document.documentElement;
    const embedded = isEmbeddedBrowser(navigator.userAgent);
    root.dataset.browserProfile = embedded ? 'embedded' : 'standard';
    let disposed = false, instance: Lenis | null = null, raf = 0, ticking = false, primeFrame = false, scrolling = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function stop() {
      cancelAnimationFrame(raf); raf = 0; clearTimeout(timeout);
      wakeScrollRef.current = () => {};
      instance?.destroy(); instance = null;
      delete root.dataset.scrollEngine;
      delete root.dataset.scrollRaf;
      setLenis(null); if (scrolling) setIsScrolling(false); scrolling = false;
    }
    function wake() {
      if (disposed || !instance || raf || ticking || document.hidden) return;
      // Prime from the RAF clock itself. Its timestamp may precede performance.now()
      // under CPU pressure; mixing the clocks can produce a negative touch step.
      primeFrame = true;
      root.dataset.scrollRaf = 'active';
      raf = requestAnimationFrame(frame);
    }
    function frame(time: number) {
      raf = 0;
      if (disposed || !instance || document.hidden) { root.dataset.scrollRaf = 'idle'; return; }
      ticking = true;
      if (primeFrame) { instance.time = time - 1000 / 60; primeFrame = false; }
      instance.raf(time);
      ticking = false;
      if (instance.isScrolling === 'smooth') raf = requestAnimationFrame(frame);
      else root.dataset.scrollRaf = 'idle';
    }
    async function setup() {
      if (pathname !== '/') return;
      recordMotion('scroll', 'loading-lenis');
      try {
        const [{ default: Lenis }, { ScrollTrigger }] = await Promise.all([import('lenis'), import('gsap/ScrollTrigger')]);
        if (disposed) return;
        const landing = document.querySelector<HTMLElement>('.landing-page');
        const mobileTouch = matchMedia('(max-width: 767px) and (pointer: coarse)');
        instance = new Lenis({
          duration: 1.65, easing: t => 1 - Math.pow(1 - t, 3),
          smoothWheel: true, wheelMultiplier: .72,
          syncTouch: true, touchMultiplier: .82, syncTouchLerp: .065, touchInertiaExponent: 1.55,
          infinite: false, anchors: false, autoRaf: false, allowNestedScroll: true,
          respectReducedMotion: !FULL_MOTION,
          virtualScroll: input => {
            const { event } = input;
            if (event.defaultPrevented || ('touches' in event && event.touches.length > 1)) return false;
            const edge = landing?.dataset.edgeSpring;
            if (edge && edge !== 'ready') return false;
            // Modest extra travel on phones, without changing wheel or desktop input.
            if (mobileTouch.matches && event.type.startsWith('touch')) input.deltaY *= 1.15;
            return true;
          },
        });
        ScrollTrigger.config({ ignoreMobileResize: true });
        instance.on('virtual-scroll', wake);
        instance.on('scroll', () => {
          const edge = landing?.dataset.edgeSpring;
          if (edge && edge !== 'ready') return;
          ScrollTrigger.update();
          if (!scrolling) { scrolling = true; setIsScrolling(true); }
          clearTimeout(timeout);
          timeout = setTimeout(() => { scrolling = false; setIsScrolling(false); }, 150);
          wake();
        });
        wakeScrollRef.current = wake;
        root.dataset.scrollEngine = 'smooth';
        root.dataset.scrollRaf = 'idle';
        setLenis(instance);
        recordMotion('scroll', 'lenis-initialized', 'wheel-and-touch');
      } catch (error) {
        if (!disposed) { stop(); recordMotion('scroll', 'initialization-error', motionError(error)); }
      }
    }
    function visibility() {
      cancelAnimationFrame(raf); raf = 0;
      root.dataset.scrollRaf = 'idle';
      if (!document.hidden && instance) {
        instance.resize();
        instance.scrollTo(window.scrollY, { immediate: true });
        wake();
      }
    }
    void setup();
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; stop(); document.removeEventListener('visibilitychange', visibility); };
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
      // Stop any previous trip before restoring the new history destination.
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
