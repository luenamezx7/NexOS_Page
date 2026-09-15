import React, { useEffect, useRef, useMemo, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement>;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  onComplete?: () => void;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  triggerRef,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0,
  baseRotation = 0.5,
  blurStrength = 3,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return <span key={index} className="space">{word}</span>;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    const triggerEl = triggerRef?.current || el;
    if (!el || !triggerEl) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    const ctx = gsap.context(() => {
      // Container rotation animation - very subtle
      gsap.fromTo(
        el,
        { transformOrigin: '50% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: triggerEl,
            scroller,
            start: 'top bottom',
            end: rotationEnd,
            scrub: 2,
          },
        }
      );

      const wordElements = el.querySelectorAll<HTMLElement>('.word');

      // Word opacity + position animation - gentle
      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: 'opacity, filter, transform', yPercent: 15, scale: 0.98 },
        {
          ease: 'power1.out',
          opacity: 1,
          yPercent: 0,
          scale: 1,
          stagger: 0.015,
          scrollTrigger: {
            trigger: triggerEl,
            scroller,
            start: 'top bottom-=5%',
            end: wordAnimationEnd,
            scrub: 2,
            onUpdate: (self) => {
              if (self.progress >= 0.98 && !completedRef.current && onComplete) {
                completedRef.current = true;
                onComplete();
              }
            },
          },
        }
      );

      // Word blur animation - subtle
      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'power1.out',
            filter: 'blur(0px)',
            stagger: 0.015,
            scrollTrigger: {
              trigger: triggerEl,
              scroller,
              start: 'top bottom-=5%',
              end: wordAnimationEnd,
              scrub: 2,
            },
          }
        );
      }
    }, el);

    return () => {
      ctx.revert();
    };
  }, [triggerRef, scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength, onComplete]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`} role="heading" aria-level={2}>
      <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
    </div>
  );
};

export default ScrollReveal;