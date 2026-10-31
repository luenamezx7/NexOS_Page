'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}

/** Stop decorative animation work when its tab is hidden. */
export function useDocumentVisible() {
  return useSyncExternalStore(subscribe, () => !document.hidden, () => true);
}
