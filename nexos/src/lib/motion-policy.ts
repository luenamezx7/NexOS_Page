/** The complete authored experience is the site policy on every device.
 * Native browser preferences remain observable in diagnostics, but do not gate motion.
 * This adapter is local to the site; it never changes window.matchMedia.
 */
export function motionMedia(query: string): MediaQueryList {
  return window.matchMedia(query
    .replace(/\(prefers-reduced-motion:\s*reduce\)/g, '(max-width: -1px)')
    .replace(/\(prefers-reduced-motion:\s*no-preference\)/g, '(min-width: 0px)'));
}
