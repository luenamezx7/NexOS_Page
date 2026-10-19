'use client';

import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  if (entryOpen) return null;
  return <>
    <GradualBlur target="page" position="top" height="clamp(76px, 12vh, 112px)" strength={1.3}
      layers={7} curve="bezier" saturation={1.15} tint="var(--landing-edge-tint)"
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height="clamp(48px, 8vh, 84px)" strength={1.35}
      layers={7} curve="bezier" saturation={1.15} tint="var(--landing-edge-tint)" autoHide hoverIntensity={0.45}
      zIndex={30} className="landing-edge-blur" />
  </>;
}
