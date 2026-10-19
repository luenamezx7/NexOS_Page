'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  document.addEventListener('nexos-entry-change', callback);
  return () => document.removeEventListener('nexos-entry-change', callback);
}

export function usePresentationActive() {
  return useSyncExternalStore(subscribe, () => Boolean(document.querySelector('.waves-entry[open]')), () => true);
}

/** Let the real hero paint while the opening scene is still crossfading. */
export function usePresentationRevealing() {
  return useSyncExternalStore(subscribe, () => Boolean(document.querySelector('.waves-entry[open][data-revealing="true"]')), () => false);
}
