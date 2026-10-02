'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';

interface ScrollContextValue { isScrolling: boolean; lenis: Lenis | null }
const ScrollContext = createContext<ScrollContextValue>({ isScrolling: false, lenis: null });
export function useScrollContext() { return useContext(ScrollContext); }

/** Native scrolling on mobile and app screens; load Lenis only for the desktop landing. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  useEffect(() => {
    const media = matchMedia('(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let disposed = false, instance: Lenis | null = null, raf = 0, scrolling = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function stop() {
      cancelAnimationFrame(raf); raf = 0; clearTimeout(timeout);
      instance?.destroy(); instance = null;
      setLenis(null); if (scrolling) setIsScrolling(false); scrolling = false;
    }
    async function setup() {
      stop();
      if (pathname !== '/' || !media.matches || disposed) return;
      const { default: Lenis } = await import('lenis');
      if (disposed || !media.matches || instance) return;
      instance = new Lenis({ duration: 1.2, lerp: 0.08, wheelMultiplier: 1, infinite: false });
      setLenis(instance);
      instance.on('scroll', () => {
        if (!scrolling) { scrolling = true; setIsScrolling(true); }
        clearTimeout(timeout);
        timeout = setTimeout(() => { scrolling = false; setIsScrolling(false); }, 150);
      });
      function frame(time: number) { if (disposed || !instance || document.hidden) return; instance.raf(time); raf = requestAnimationFrame(frame); }
      raf = requestAnimationFrame(frame);
    }
    function visibility() {
      cancelAnimationFrame(raf); raf = 0;
      if (!document.hidden) void setup();
    }
    void setup(); media.addEventListener('change', setup); document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; stop(); media.removeEventListener('change', setup); document.removeEventListener('visibilitychange', visibility); };
  }, [pathname]);
  return <ScrollContext.Provider value={{ isScrolling, lenis }}><div className={isScrolling ? 'is-scrolling' : undefined}>{children}</div></ScrollContext.Provider>;
}
