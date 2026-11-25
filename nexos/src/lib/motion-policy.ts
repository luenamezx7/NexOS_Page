export function motionMedia(query: string): MediaQueryList {
  return window.matchMedia(query);
}
/** All scenes honor the actual device preference. */
export const FULL_MOTION = false;
