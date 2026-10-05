'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const DESKTOP_EFFECTS = '(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

function subscribe(callback: () => void) {
  const media = window.matchMedia(DESKTOP_EFFECTS);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function snapshot() {
  return window.matchMedia(DESKTOP_EFFECTS).matches;
}

/** Keep optional GPU effects out of the first paint and off touch/reduced-motion devices. */
export function useDesktopEffects() {
  const desktop = useSyncExternalStore(subscribe, snapshot, () => false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!desktop) return;
    let idle: number | undefined;
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') {
        idle = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      } else {
        setReady(true);
      }
    }, 1500);
    return () => {
      window.clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [desktop]);
  return desktop && ready;
}
