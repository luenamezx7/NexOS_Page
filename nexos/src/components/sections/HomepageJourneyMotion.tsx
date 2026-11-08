'use client';

import { useEffect } from 'react';
import { usePresentationActive } from '@/lib/use-presentation-active';

/** Reversible desktop scroll handoffs and short mobile entries; content stays in normal flow. */
export function HomepageJourneyMotion() {
  const presenting = usePresentationActive();
  useEffect(() => {
    if (presenting || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    let revert = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      const root = document.querySelector<HTMLElement>('.landing-page');
      if (!root) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)', mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)' }, context => {
        const desktop = !!context.conditions?.desktop;
        const plateGrid = root.querySelector<HTMLElement>('[data-plate-grid]');
        const options = [...root.querySelectorAll<HTMLElement>('#showcase [data-plate-option]')];
        if (plateGrid && options.length === 4) {
          if (desktop) {
            const plates = options.map(option => option.querySelector<HTMLElement>('[data-plate-motion]')!);
            const captions = options.map(option => option.querySelector<HTMLElement>('[data-plate-caption]')!);
            gsap.timeline({ scrollTrigger: { trigger: plateGrid, start: 'top 92%', end: 'top 38%', scrub: .85, invalidateOnRefresh: true } })
              .fromTo(plates, { x: (i: number) => [-22, -8, 8, 22][i], y: (i: number) => [38, 44, 38, 44][i], rotation: (i: number) => [-3, -1, 1, 3][i], scale: .965, opacity: .55 }, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: .85, stagger: .08, ease: 'power2.out', immediateRender: false }, 0)
              .fromTo(captions, { y: 12, opacity: .55 }, { y: 0, opacity: 1, duration: .65, stagger: .08, ease: 'power2.out', immediateRender: false }, .18);
          } else {
            options.forEach(option => {
              const plate = option.querySelector<HTMLElement>('[data-plate-motion]');
              const caption = option.querySelector<HTMLElement>('[data-plate-caption]');
              if (!plate || !caption) return;
              gsap.fromTo(plate, { y: 18, scale: .975, opacity: .65 }, {
                y: 0, scale: 1, opacity: 1, duration: .7, ease: 'power2.out', immediateRender: false,
                scrollTrigger: { trigger: option, start: 'top 92%', once: true },
              });
              gsap.fromTo(caption, { y: 10, opacity: .7 }, {
                y: 0, opacity: 1, duration: .6, delay: .08, ease: 'power2.out', immediateRender: false,
                scrollTrigger: { trigger: option, start: 'top 92%', once: true },
              });
            });
          }
        }
         for (const id of ['plate-management', 'easychat']) {
          const visual = root.querySelector<HTMLElement>(`#${id} [data-journey-visual]`);
          if (!visual) continue;
          gsap.fromTo(visual, { y: desktop ? 32 : 16, opacity: .65 }, {
            y: 0, opacity: 1, ease: desktop ? 'none' : 'power2.out', duration: desktop ? undefined : .6, immediateRender: false,
            scrollTrigger: desktop
              ? { trigger: `#${id}`, start: 'top 90%', end: 'top 55%', scrub: .3, invalidateOnRefresh: true }
              : { trigger: visual, start: 'top 92%', once: true },
          });
        }
      }, root);
      revert = () => mm.revert();
    });
    return () => { disposed = true; revert(); };
  }, [presenting]);
  return null;
}
