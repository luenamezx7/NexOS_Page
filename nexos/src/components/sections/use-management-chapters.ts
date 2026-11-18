'use client';

import { useEffect, type RefObject } from 'react';
import { cinematicDesktopQuery } from '@/lib/motion-presets';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { usePresentationActive } from '@/lib/use-presentation-active';

/** Chapter boundaries own automatic selection; manual choices last until the next boundary. */
export function useManagementChapters(stageRef: RefObject<HTMLDivElement | null>, onChapter: (index: number) => void) {
  const presenting = usePresentationActive();
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || presenting) return;
    let disposed = false;
    let revert = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      revert = () => media.revert();
      media.add({ pinned: cinematicDesktopQuery, flow: '(min-width: 0px)' }, context => {
        const pinned = Boolean(context.conditions?.pinned);
        let chapter = -1;
        if (pinned) stage.dataset.managementChapters = 'true';
        stage.dataset.managementMotion = 'scroll';
        ScrollTrigger.create({
          id: 'management-chapters', trigger: stage, pin: pinned ? stage : false,
          start: pinned ? 'top 110px' : 'top 75%', end: pinned ? () => `+=${Math.round((innerHeight - 110) * 1.8)}` : 'bottom 25%',
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => {
            if (document.querySelector('dialog[open]')) return;
            const next = Math.min(2, Math.floor(self.progress * 3));
            if (next === chapter) return;
            chapter = next;
            onChapter(next);
          },
        });
        return () => { delete stage.dataset.managementChapters; delete stage.dataset.managementMotion; };
      }, stage);
      ScrollTrigger.refresh();
    }).catch(error => {
      revert();
      recordMotion('managementChapters', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; revert(); };
  }, [onChapter, presenting, stageRef]);
}
