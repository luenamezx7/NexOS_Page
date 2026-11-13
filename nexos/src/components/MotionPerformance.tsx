'use client';

import { useEffect } from 'react';
import { createMotionDetailBudget } from '@/lib/animation-budget';
import { usePresentationActive } from '@/lib/use-presentation-active';

/** Sample during interaction only; never run a permanent monitoring loop. */
export function MotionPerformance() {
  const presenting = usePresentationActive();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.landing-page');
    if (!root || presenting) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const constrained = (memory !== undefined && memory <= 4) || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
    const initial = constrained ? 'light' : 'full';
    const budget = createMotionDetailBudget(initial);
    root.dataset.motionDetail = initial;
    let frame = 0, previous = 0, until = 0;
    const stop = () => { cancelAnimationFrame(frame); frame = previous = 0; };
    const sample = (now: number) => {
      frame = 0;
      if (document.hidden || now > until) { previous = 0; return; }
      if (previous) {
        const detail = budget.sample(now - previous);
        if (root.dataset.motionDetail !== detail) root.dataset.motionDetail = detail;
      }
      previous = now;
      frame = requestAnimationFrame(sample);
    };
    const wake = () => {
      if (document.hidden) return;
      until = performance.now() + 2200;
      if (!frame) frame = requestAnimationFrame(sample);
    };
    window.addEventListener('scroll', wake, { passive: true });
    document.addEventListener('visibilitychange', stop);
    wake();
    return () => {
      stop();
      window.removeEventListener('scroll', wake);
      document.removeEventListener('visibilitychange', stop);
      delete root.dataset.motionDetail;
    };
  }, [presenting]);
  return null;
}
