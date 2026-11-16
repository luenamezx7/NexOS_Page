/** Keep system preferences intact for every animation integration. */
export function motionMedia(query: string): MediaQueryList {
  return window.matchMedia(query);
}
