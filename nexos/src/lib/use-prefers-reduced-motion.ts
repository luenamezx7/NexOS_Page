'use client';

/** Compatibility hook: the site always presents the full authored motion.
 * Browser preference is reported separately by MotionDiagnostics.
 */
export function usePrefersReducedMotion() {
  return false;
}
