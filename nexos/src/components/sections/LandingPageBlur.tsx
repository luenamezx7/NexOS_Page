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
    <GradualBlur target="page" position="top" height={mobile ? '48px' : '88px'} strength={mobile ? .5 : 1}
      layers={mobile ? 1 : 2} curve="linear" exponential
      zIndex={40} className="landing-header-blur" />
    <GradualBlur target="page" position="bottom" height={mobile ? '32px' : '56px'} strength={mobile ? .5 : 1}
      layers={mobile ? 1 : 2} curve="linear" exponential
      zIndex={30} className="landing-edge-blur" />
  </>;
}
