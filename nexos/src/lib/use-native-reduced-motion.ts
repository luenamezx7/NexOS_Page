'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (notify: () => void) => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const snapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Native preference for surfaces which explicitly opt into reduced motion. */
export function useNativeReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
