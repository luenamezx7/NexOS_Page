'use client';

import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  if (entryOpen) return null;
  return <>
    <GradualBlur target="page" position="top" height="clamp(96px, 16svh, 160px)" strength={3}
      layers={8} curve="linear" exponential
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height="clamp(120px, 24svh, 240px)" strength={4}
      layers={8} curve="linear" exponential autoHide
      zIndex={30} className="landing-edge-blur" />
  </>;
}
