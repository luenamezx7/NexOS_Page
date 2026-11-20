'use client';

import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useEffect } from 'react';
import { useLocale } from '@/lib/locale';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const hasOwnMotion = (heading: Element) => heading.hasAttribute('data-heading-static') || heading.hasAttribute('data-scroll-fill-heading') || Boolean(heading.closest('dialog, [aria-hidden="true"], .sr-only'));

/** One scroll animation per heading, including headings mounted by lazy sections. */
export function HeadingScrollMotion() {
  const reduce = usePrefersReducedMotion();
  const presenting = usePresentationActive();
  const { locale } = useLocale();

  useEffect(() => {
    if (presenting || reduce) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const root = document.querySelector<HTMLElement>('.landing-page');
      if (disposed || !root) return;
      gsap.registerPlugin(ScrollTrigger);
      const headings = new Map<HTMLElement, () => void>();
      let frame = 0;
      let lastWidth = -1;
      let lastHeight = -1;

      const sync = () => {
        frame = 0;
        if (disposed) return;
        let changed = false;
        headings.forEach((revert, heading) => {
          if (!root.contains(heading) || hasOwnMotion(heading)) { revert(); headings.delete(heading); changed = true; }
        });
        root.querySelectorAll<HTMLElement>(HEADINGS).forEach(heading => {
          if (headings.has(heading) || hasOwnMotion(heading)) return;
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
          changed = true;
        });
        const width = root.offsetWidth;
        const height = root.offsetHeight;
        // The initial ResizeObserver delivery and fonts.ready often describe
        // the same layout. Avoid refreshing every trigger repeatedly at startup.
        if (changed || width !== lastWidth || height !== lastHeight) ScrollTrigger.refresh();
        lastWidth = width;
        lastHeight = height;
        recordMotion('headingGsap', 'initialized', `${headings.size} headings`);
      };
      const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(sync); };
      const containsHeading = (node: Node) => node instanceof Element && (node.matches(HEADINGS) || !!node.querySelector(HEADINGS));
      const observer = new MutationObserver(records => {
        // Ignore character-by-character typing and other unrelated DOM updates.
        if (records.some(record => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some(containsHeading))) schedule();
      });
      observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-heading-static', 'data-scroll-fill-heading'] });
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
  }, [presenting, locale, reduce]);

  return null;
}
