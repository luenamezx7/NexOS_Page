'use client';

import { useEffect, useState } from 'react';
import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  if (entryOpen || heroVisible) return null;
  return <>
    <GradualBlur target="page" position="top" height="clamp(72px, 12svh, 120px)" strength={3}
      layers={4} curve="linear" exponential
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height="clamp(96px, 18svh, 160px)" strength={4}
      layers={4} curve="linear" exponential autoHide
      zIndex={30} className="landing-edge-blur" />
  </>;
}
