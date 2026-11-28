'use client';

import { useEffect, type RefObject } from 'react';
import { cinematicDesktopQuery } from '@/lib/motion-presets';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { usePresentationGate } from '@/lib/use-presentation-active';

/** Chapter boundaries own automatic selection; manual choices last until the next boundary. */
export function useManagementChapters(stageRef: RefObject<HTMLDivElement | null>, onChapter: (index: number) => void) {
  const presenting = usePresentationGate();
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
        let previousScroll = window.scrollY;
        if (pinned) stage.dataset.managementChapters = 'true';
        stage.dataset.managementMotion = 'scroll';
        ScrollTrigger.create({
          id: 'management-chapters', trigger: stage, pin: pinned ? stage : false,
          // This upstream pin must contribute its spacing before later scenes refresh.
          refreshPriority: 2,
          start: pinned ? 'top 110px' : 'top 75%', end: pinned ? () => `+=${Math.round((innerHeight - 110) * 1.8)}` : 'bottom 25%',
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => {
            const scroll = self.scroll();
            const moved = Math.abs(scroll - previousScroll) > .5;
            previousScroll = scroll;
            const next = Math.min(2, Math.floor(self.progress * 3));
            const initial = chapter < 0;
            const changed = next !== chapter;
            chapter = next;
            // Modal mounting, focus restoration and scrollbar compensation must
            // never replace a user's manually selected chapter behind a dialog.
            if (document.querySelector('dialog[open], dialog[data-management-simulation]') || document.documentElement.style.overflow === 'hidden') return;
            if (changed && (moved || initial)) onChapter(next);
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
