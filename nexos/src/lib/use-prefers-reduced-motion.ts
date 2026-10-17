'use client';

import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

/** Match the server on hydration, then follow the browser preference. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
