/** Product policy: full motion, without changing the browser's reported preference. */
export const FULL_MOTION = true;

export function motionMedia(query: string): MediaQueryList {
  return window.matchMedia(query
    .replace(/\(prefers-reduced-motion:\s*no-preference\)/g, '(min-width: 0px)')
    .replace(/\(prefers-reduced-motion:\s*reduce\)/g, '(max-width: 0px)'));
}
