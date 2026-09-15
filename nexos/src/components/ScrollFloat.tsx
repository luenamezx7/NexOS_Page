'use client';

import React, { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  onComplete?: () => void;
  splitBy?: 'chars' | 'words';
}

interface ScrollTriggerVars {
  trigger: Element | string;
  scroller: Element | Window;
  start: string;
  end: string;
  scrub: true;
  onComplete?: () => void;
  onUpdate?: (self: ScrollTrigger) => void;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1.2,
  ease = 'power3.out',
  scrollStart = 'top bottom+=20%',
  scrollEnd = 'bottom top-=20%',
  stagger = 0.12,
  onComplete,
  splitBy = 'words',
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const completedRef = useRef(false);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    if (splitBy === 'words') {
      const words = text.trim().split(/\s+/);
      return words.map((word, index) => (
        <span className="word" key={index} style={{ '--word-index': String(index) } as React.CSSProperties}>
          {word}
        </span>
      ));
    }
    return text.split('').map((char, index) => (
      <span className="char" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children, splitBy]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    const elements = el.querySelectorAll(splitBy === 'words' ? '.word' : '.char');

    const ctx = gsap.context(() => {
      animationRef.current = gsap.fromTo(
        elements,
        {
          willChange: 'opacity, transform, filter',
          opacity: 0,
          yPercent: 100,
          scaleY: 1.5,
          scaleX: 0.8,
          transformOrigin: '50% 0%',
          filter: 'blur(8px)',
        },
        {
          duration: animationDuration,
          ease: ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          filter: 'blur(0px)',
          stagger: stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: scrollStart,
            end: scrollEnd,
            scrub: true,
            onComplete: () => {
              if (!completedRef.current && onComplete) {
                completedRef.current = true;
                onComplete();
              }
            },
            onUpdate: (self: ScrollTrigger) => {
              if (self.progress >= 1 && !completedRef.current && onComplete) {
                completedRef.current = true;
                onComplete();
              }
            },
          } as ScrollTriggerVars,
        }
      );
    }, el);

    return () => {
      ctx.revert();
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, onComplete, splitBy]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`} role="heading" aria-level={2}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

export default ScrollFloat;