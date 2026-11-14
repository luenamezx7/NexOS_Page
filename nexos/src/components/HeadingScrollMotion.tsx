'use client';

import { useEffect } from 'react';
import { useLocale } from '@/lib/locale';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/** One scroll animation per heading, including headings mounted by lazy sections. */
export function HeadingScrollMotion() {
  const presenting = usePresentationActive();
  const { locale } = useLocale();

  useEffect(() => {
    if (presenting) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const root = document.querySelector<HTMLElement>('.landing-page');
      if (disposed || !root) return;
      gsap.registerPlugin(ScrollTrigger);
      const headings = new Map<HTMLElement, () => void>();
      let frame = 0;

      const sync = () => {
        frame = 0;
        if (disposed) return;
        headings.forEach((revert, heading) => {
          if (!root.contains(heading)) { revert(); headings.delete(heading); }
        });
        root.querySelectorAll<HTMLElement>(HEADINGS).forEach(heading => {
          if (headings.has(heading) || heading.hasAttribute('data-heading-static') || heading.closest('dialog, [aria-hidden="true"], .sr-only')) return;
          const context = gsap.context(() => {
            gsap.fromTo(heading, { autoAlpha: .15, y: 24 }, {
              autoAlpha: 1, y: 0, ease: 'none',
              scrollTrigger: {
                id: `heading-${heading.id || headings.size}`,
                trigger: heading, start: 'clamp(top 92%)', end: 'clamp(top 62%)',
                scrub: .4, invalidateOnRefresh: true,
              },
            });
          }, root);
          heading.dataset.headingScroll = 'ready';
          headings.set(heading, () => { context.revert(); delete heading.dataset.headingScroll; });
        });
        ScrollTrigger.refresh();
        recordMotion('headingGsap', 'initialized', `${headings.size} headings`);
      };
      const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(sync); };
      const containsHeading = (node: Node) => node instanceof Element && (node.matches(HEADINGS) || !!node.querySelector(HEADINGS));
      const observer = new MutationObserver(records => {
        // Ignore character-by-character typing and other unrelated DOM updates.
        if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(containsHeading))) schedule();
      });
      observer.observe(root, { childList: true, subtree: true });
      const resize = new ResizeObserver(schedule);
      resize.observe(root);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect(); resize.disconnect();
        headings.forEach(revert => revert()); headings.clear();
      };
      sync();
      void document.fonts.ready.then(schedule);
    }).catch(error => {
      cleanup();
      if (!disposed) recordMotion('headingGsap', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; cleanup(); };
  }, [presenting, locale]);

  return null;
}
