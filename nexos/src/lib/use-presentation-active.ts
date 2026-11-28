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

/**
 * For below-the-fold scenes that only defer their setup (GSAP, ScrollTrigger,
 * observers) until the opening ends. The cover marks itself `data-warm` about
 * 1.4 s before it fades; setting up then, behind the still-opaque cover (whose
 * animation runs in a worker), keeps that one-off main-thread cost out of the
 * fade and out of the visitor's first scroll.
 */
export function usePresentationGate() {
  return useSyncExternalStore(subscribe, () => Boolean(document.querySelector(`${PRESENTATION_SELECTOR}:not([data-warm])`)), () => false);
}
