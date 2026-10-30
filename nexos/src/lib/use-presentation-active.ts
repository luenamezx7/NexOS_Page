'use client';

import { useSyncExternalStore } from 'react';

export const PRESENTATION_SELECTOR = 'dialog[data-presentation][open]';

function subscribe(callback: () => void) {
  document.addEventListener('nexos-entry-change', callback);
  return () => document.removeEventListener('nexos-entry-change', callback);
}

export function usePresentationActive() {
  return useSyncExternalStore(subscribe, () => Boolean(document.querySelector(PRESENTATION_SELECTOR)), () => false);
}

/** Let the real hero paint while the opening scene is still crossfading. */
export function usePresentationRevealing() {
  return useSyncExternalStore(subscribe, () => Boolean(document.querySelector(`${PRESENTATION_SELECTOR}[data-revealing="true"]`)), () => false);
}
