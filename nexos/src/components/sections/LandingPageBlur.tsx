'use client';

import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  if (entryOpen) return null;
  return <>
    <GradualBlur target="page" position="top" height="clamp(76px, 12vh, 112px)" strength={1.3}
      layers={7} curve="bezier" saturation={1.15} tint="var(--landing-edge-tint)" bloom={0.06}
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height="clamp(56px, 9vh, 88px)" strength={5.25}
      layers={8} curve="linear" exponential opacity={0.5} saturation={2.5}
      tint="var(--landing-edge-tint)" bloom={0.12} autoHide hoverIntensity={1.2}
      zIndex={30} className="landing-edge-blur" />
  </>;
}
