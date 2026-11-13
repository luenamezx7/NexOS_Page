'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Scroll-linked positioning keeps live text sharp; transform/scale/3D would rasterize it. */
export function PhoneScrollHero({ titleComponent, children, className }: { titleComponent: ReactNode; children: ReactNode; className?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !sectionRef.current || !phoneRef.current || !titleRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const section = sectionRef.current;
      const phone = phoneRef.current;
      const title = titleRef.current;
      const mm = gsap.matchMedia();
      // Desktop uses integer offsets to keep live text sharp.
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: .35 } });
        timeline.fromTo(title, { top: -12, opacity: .75 }, {
          top: 12, opacity: 1, ease: 'none', modifiers: { top: value => `${Math.round(parseFloat(value))}px` },
        }, 0).fromTo(phone, { top: 24 }, {
          top: -24, ease: 'none', modifiers: { top: value => `${Math.round(parseFloat(value))}px` },
        }, 0);
        return () => timeline.revert();
      });
      // Touch devices get the same scroll response on two compositor layers,
      // without layout writes or pinning that competes with native scrolling.
      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
        timeline.fromTo(title, { y: -8, opacity: .8 }, { y: 8, opacity: 1, ease: 'none' }, 0)
          .fromTo(phone, { y: 16 }, { y: -16, ease: 'none', modifiers: { y: value => `${Math.round(parseFloat(value))}px` } }, 0);
        return () => timeline.revert();
      });
      cleanup = () => mm.revert();
    });
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div ref={sectionRef} className={cn('relative mx-auto flex min-h-[650px] flex-col items-center justify-center py-16 text-center max-md:min-h-[520px]', className)}>
    <div ref={titleRef} className="relative z-0 max-w-4xl">{titleComponent}</div>
    <div ref={phoneRef} data-phone-scroll className="relative z-10 mt-12 md:mt-10">{children}</div>
  </div>;
}
