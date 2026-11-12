'use client';

import { Children, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ReactBitsScrollReveal.module.css';

gsap.registerPlugin(ScrollTrigger);
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (value: number) => value * value * (3 - 2 * value);
const clampToScroll = (value: string) => value.startsWith('clamp(') ? value : `clamp(${value})`;

interface Props {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  highlightColor?: string | null;
  mode?: 'scrub' | 'enter';
  splitBy?: 'words' | 'chars' | 'lines';
  effect?: 'fade' | 'rise' | 'flip' | 'scale';
  stagger?: number;
  duration?: number;
  smoothing?: number;
  baseOpacity?: number;
  baseRotation?: number;
  baseOffset?: number;
  enableBlur?: boolean;
  blurStrength?: number;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  containerClassName?: string;
  textClassName?: string;
}

/** React Bits word reveal, scoped so it does not replace the site's existing ScrollReveal. */
export default function ReactBitsScrollReveal({
  children, scrollContainerRef, highlightColor = '', mode = 'scrub', splitBy = 'words', effect = 'fade',
  stagger = .05, duration = .8, smoothing = 0, baseOpacity = .1, baseRotation = 3, baseOffset = 0,
  enableBlur = true, blurStrength = 4, rotationEnd = 'bottom bottom', wordAnimationEnd = 'bottom bottom',
  containerClassName = '', textClassName = '',
}: Props) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const text = useMemo(() => {
    const parts = Children.toArray(children);
    return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
  }, [children]);
  const splitText = useMemo(() => text?.split(/(\s+)/).map((word, index) => word.trim() ?
    <span key={index} className={styles.word}>{splitBy === 'chars' ? Array.from(word).map((char, charIndex) =>
      <span className={styles.piece} key={charIndex}>{char}</span>) : <span className={styles.piece}>{word}</span>}</span> : word), [text, splitBy]);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    const textEl = textRef.current;
    if (!el || !textEl || (scrollContainerRef && !scrollContainerRef.current)) return;
    const scroller = scrollContainerRef?.current || window;
    const wrappers = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.word}`));
    const pieces = wrappers.length ? Array.from(el.querySelectorAll<HTMLElement>(`.${styles.piece}`)) : [textEl];
    const viewportHeight = () => scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight;
    const span = mode === 'enter' ? Math.max(.05, duration) : .5;
    const gap = Math.max(0, stagger);
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const order = pieces.map((_, index) => index);
      const last = pieces.map(() => -1);
      const state = { p: 0 };
      let count = pieces.length;
      const measure = () => {
        if (splitBy !== 'lines' || !wrappers.length) return;
        let line = -1, top = -Infinity;
        wrappers.forEach((wrapper, index) => {
          if (Math.abs(wrapper.offsetTop - top) > 2) { line += 1; top = wrapper.offsetTop; }
          order[index] = line;
        });
        count = line + 1;
      };
      const total = () => span + Math.max(0, count - 1) * gap;
      const render = () => {
        const at = state.p * total();
        pieces.forEach((piece, index) => {
          const t = clamp01((at - order[index] * gap) / span);
          if (last[index] === t) return;
          last[index] = t;
          const easeOut = 1 - Math.pow(1 - t, 3);
          const back = (overshoot: number) => 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
          const reveal = effect === 'rise' ? easeOut : effect === 'flip' ? back(1.2) : effect === 'scale' ? back(1.6) : t;
          const fade = effect === 'rise' ? clamp01(reveal * 1.25) : effect === 'flip' ? clamp01(t * 2) : effect === 'scale' ? clamp01(t * 1.6) : t;
          const lift = baseOffset * (1 - clamp01(reveal));
          const motion = effect === 'rise' ? `translateY(${((1 - reveal) * .8).toFixed(3)}em)` :
            effect === 'flip' ? `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)` :
              effect === 'scale' ? `scale(${(.35 + .65 * reveal).toFixed(4)})` : '';
          piece.style.opacity = t >= 1 ? '' : String(baseOpacity + (1 - baseOpacity) * fade);
          piece.style.transform = [lift ? `translateY(${lift.toFixed(2)}px)` : '', motion].filter(Boolean).join(' ');
          if (enableBlur) piece.style.filter = t < 1 ? `blur(${(blurStrength * (1 - clamp01(reveal))).toFixed(2)}px)` : '';
          if (highlightColor) {
            const glow = t <= 0 || t >= 1 ? 0 : t < .35 ? smooth(t / .35) : 1 - smooth((t - .35) / .65);
            piece.style.color = glow > .002 ? `color-mix(in srgb, ${highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)` : '';
          }
        });
      };
      measure();
      pieces.forEach(piece => { piece.style.willChange = pieces.length > 80 ? '' : 'opacity'; });
      render();
      if (mode === 'enter') {
        let played = false;
        ScrollTrigger.create({ trigger: el, scroller, start: 'top 80%', onEnter: () => {
          if (played) return;
          played = true;
          gsap.to(state, { p: 1, duration: total(), ease: 'none', onUpdate: render });
          if (baseRotation) gsap.fromTo(el, { rotate: baseRotation }, { rotate: 0, duration: Math.min(total(), 1.4) });
        } });
      } else {
        if (baseRotation) gsap.fromTo(el, { rotate: baseRotation, transformOrigin: '0% 50%' }, {
          rotate: 0, ease: 'none', scrollTrigger: { trigger: el, scroller, start: 'top bottom', end: clampToScroll(rotationEnd), scrub: smoothing > 0 ? smoothing : true },
        });
        gsap.to(state, { p: 1, ease: 'none', onUpdate: render, scrollTrigger: {
          trigger: el, scroller, start: () => `top bottom-=${.2 * Math.min(el.offsetHeight, viewportHeight())}`,
          end: clampToScroll(wordAnimationEnd), scrub: smoothing > 0 ? smoothing : true,
        } });
      }
      const observer = splitBy === 'lines' && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { measure(); last.fill(-1); render(); }) : null;
      observer?.observe(textEl);
      return () => { observer?.disconnect(); pieces.forEach(piece => {
        for (const property of ['opacity', 'transform', 'filter', 'color', 'will-change']) piece.style.removeProperty(property);
      }); };
    });
    // GSAP removes only this instance's triggers and restores the unanimated text on cleanup.
    return () => mm.revert();
  }, [scrollContainerRef, text, splitBy, effect, mode, duration, highlightColor, enableBlur, baseOpacity, baseRotation, blurStrength, baseOffset, stagger, smoothing, rotationEnd, wordAnimationEnd]);

  return <h2 ref={containerRef} className={`${styles.reveal} ${containerClassName}`} aria-label={text ?? undefined}>
    <span ref={textRef} className={`${styles.text} ${textClassName}`} aria-hidden={text === null ? undefined : true}>{splitText ?? children}</span>
  </h2>;
}
