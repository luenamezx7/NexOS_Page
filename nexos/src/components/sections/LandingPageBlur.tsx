'use client';

import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

/** A narrow, persistent viewport edge. No scroll listeners or hit targets. */
export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  if (entryOpen) return null;
  return <GradualBlur target="page" position="bottom" height="clamp(44px, 7svh, 72px)"
    strength={1.5} layers={3} curve="bezier" exponential
    zIndex={35} className="landing-edge-blur" />;
}
