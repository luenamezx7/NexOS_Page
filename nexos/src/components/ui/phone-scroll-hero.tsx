'use client';

import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';

/** One scroll owner. Integer top offsets keep live chat text sharp on desktop and touch. */
export function PhoneScrollHero({ titleComponent, children, className }: { titleComponent: ReactNode; children: ReactNode; className?: string }) {
  const reduce = usePrefersReducedMotion();
  const presenting = usePresentationActive();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || presenting) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const section = sectionRef.current;
      const phone = phoneRef.current;
      const title = titleRef.current;
      if (disposed || !section || !phone || !title) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        const integer = (value: string) => `${Math.round(parseFloat(value))}px`;
        gsap.timeline({ scrollTrigger: {
          id: 'easychat-phone', trigger: section, start: 'top 90%', end: 'bottom 20%',
          scrub: .35, invalidateOnRefresh: true,
        } })
          .fromTo(title, { top: -12, opacity: .8 }, { top: 0, opacity: 1, ease: 'none', modifiers: { top: integer } }, 0)
          .fromTo(phone, { top: () => innerWidth < 768 ? 24 : 40 }, { top: -16, ease: 'none', modifiers: { top: integer } }, 0);
      }, section);
      cleanup = () => context.revert();
      ScrollTrigger.refresh();
      void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    }).catch(error => {
      cleanup();
      recordMotion('easychatPhone', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; cleanup(); };
  }, [presenting, reduce]);

  return <div ref={sectionRef} data-phone-journey className={cn('relative mx-auto flex min-h-[650px] flex-col items-center justify-center py-16 text-center max-md:min-h-[520px]', className)}>
    <div ref={titleRef} data-phone-title className="relative z-0 w-full max-w-4xl">{titleComponent}</div>
    <div ref={phoneRef} data-phone-scroll className="relative z-10 mt-12 md:mt-10">{children}</div>
  </div>;
}
