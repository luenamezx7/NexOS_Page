'use client';

import { useEffect, type RefObject } from 'react';
import { motionTiming } from '@/lib/motion-presets';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';

/** Text entry only. The avatar and popup must never be pinned or animated. */
export function useHeroChoreography(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || reduced || (location.hash && location.hash !== '#hero')) return;
    let disposed = false;
    let revert = () => {};
    void import('gsap').then(({ gsap }) => {
      if (disposed) return;
      const context = gsap.context(() => {
        gsap.fromTo(root.querySelectorAll('[data-hero-enter]'), { y: 22, opacity: 0 }, {
          y: 0, opacity: 1, duration: motionTiming.entrance,
          stagger: .075, ease: 'power3.out', clearProps: 'transform,opacity',
        });
        // The outer mask reveals the ink; the inner shape owns its permanent
        // typographic stretching. Neither touches the avatar or the CTAs.
        gsap.fromTo(root.querySelector('[data-avatar-word]'), { clipPath: 'inset(0 0 100% 0)' }, {
          clipPath: 'inset(-30% -4% -30% -4%)', duration: .9, delay: .15,
          ease: 'power3.out', clearProps: 'clipPath',
        });
      }, root);
      revert = () => context.revert();
      recordMotion('heroChoreography', 'initialized', 'text-only; static avatar and popup');
    }).catch(error => {
      revert();
      recordMotion('heroChoreography', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; revert(); };
  }, [enabled, reduced, rootRef]);
}
