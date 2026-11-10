'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import GradualBlur from '../ui/GradualBlur';
import { usePresentationActive } from '@/lib/use-presentation-active';

const subscribe = (callback: () => void) => {
  const media = matchMedia('(max-width: 767px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

export function LandingPageBlur() {
  const entryOpen = usePresentationActive();
  const mobile = useSyncExternalStore(subscribe, () => matchMedia('(max-width: 767px)').matches, () => false);
  const [quizVisible, setQuizVisible] = useState(false);

  useEffect(() => {
    const quiz = document.getElementById('contact');
    if (!quiz) return;
    const observer = new IntersectionObserver(([entry]) => setQuizVisible(entry.isIntersecting));
    observer.observe(quiz);
    return () => observer.disconnect();
  }, []);

  if (entryOpen || quizVisible) return null;
  return <>
    <GradualBlur target="page" position="top" height={mobile ? 'clamp(48px, 9svh, 72px)' : 'clamp(72px, 12svh, 120px)'} strength={mobile ? 1.5 : 3}
      layers={mobile ? 2 : 4} curve="linear" exponential
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height={mobile ? 'clamp(56px, 10svh, 84px)' : 'clamp(96px, 18svh, 160px)'} strength={mobile ? 1.8 : 4}
      layers={mobile ? 2 : 4} curve="linear" exponential autoHide={!mobile}
      zIndex={30} className="landing-edge-blur" />
  </>;
}
