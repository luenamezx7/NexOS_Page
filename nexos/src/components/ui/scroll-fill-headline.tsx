'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './scroll-fill-headline.module.css';

/*
 * Word-by-word fill driven by scroll position.
 *
 * Previously every heading ran Motion's `useScroll({ target })`, which walks the
 * offsetParent chain of each target on every scroll frame. With ~18 headings on
 * the home page that cost ~5 s of main-thread time per full scroll on a 4×
 * throttled phone. Browsers with scroll-driven animations now animate the words
 * on the compositor (CSS view timeline). Others share a single passive listener
 * that only measures headings currently intersecting the viewport.
 */

const supportsViewTimeline = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

type Subject = { el: HTMLElement; visible: boolean };
const subjects = new Set<Subject>();
let frame = 0;
let observer: IntersectionObserver | null = null;

function paint() {
  frame = 0;
  const vh = innerHeight;
  // Reads first, then writes: no layout thrash between headings.
  const values: [HTMLElement, number][] = [];
  subjects.forEach(({ el, visible }) => {
    if (!visible) return;
    const r = el.getBoundingClientRect();
    // offset ['start 80%', 'end 45%']
    const start = r.top - vh * .8;
    const end = r.bottom - vh * .45;
    const progress = start >= 0 ? 0 : end <= 0 ? 1 : -start / (end - start);
    values.push([el, progress]);
  });
  values.forEach(([el, progress]) => el.style.setProperty('--fill-progress', progress.toFixed(3)));
}
const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };

function track(el: HTMLElement) {
  const subject: Subject = { el, visible: false };
  if (!subjects.size) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => subjects.forEach(s => { if (s.el === entry.target) s.visible = entry.isIntersecting; }));
      schedule();
    }, { rootMargin: '10% 0px' });
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
  }
  subjects.add(subject);
  observer!.observe(el);
  return () => {
    observer?.unobserve(el);
    subjects.delete(subject);
    el.style.removeProperty('--fill-progress');
    if (!subjects.size) {
      observer?.disconnect(); observer = null;
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(frame); frame = 0;
    }
  };
}

function useScrollFill(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || supportsViewTimeline()) return;
    el.style.setProperty('--fill-progress', '0');
    return track(el);
  }, [ref, enabled]);
}

function FillWords({ lines, reduced }: { lines: readonly string[]; reduced: boolean }) {
  const total = lines.reduce((count, line) => count + line.trim().split(/\s+/).length, 0);
  let index = 0;
  return <>{lines.map((line, lineIndex) => <span className={styles.line} key={lineIndex}>
    {line.trim().split(/\s+/).map((word, wordIndex) => {
      const current = index++;
      const style = { '--fill-a': (current / total).toFixed(4), '--fill-b': Math.min(1, (current + 1.5) / total).toFixed(4) } as React.CSSProperties;
      return <React.Fragment key={wordIndex}>
        {reduced ? <span>{word}</span> : <span className={styles.word} style={style} data-scroll-fill-word>{word}</span>}
        {' '}
      </React.Fragment>;
    })}
  </span>)}</>;
}

/** The word-fill treatment for an existing heading, without nesting headings. */
export function ScrollFillText({ lines, className }: { lines: readonly string[]; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  useScrollFill(ref, !reduced);
  return <span ref={ref} className={cn(styles.text, styles.timeline, className)} data-scroll-fill>
    <FillWords lines={lines} reduced={reduced} />
  </span>;
}

export interface ScrollFillHeadlineProps {
  lines: [string, string];
  className?: string;
  id?: string;
}

export function ScrollFillHeadline({ lines, className, id }: ScrollFillHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  const generatedId = React.useId();
  const headingId = `${id ?? generatedId}-title`;
  const reduced = usePrefersReducedMotion();
  useScrollFill(ref, !reduced);
  return <section ref={ref} id={id} className={cn(styles.section, styles.timeline, className)} aria-labelledby={headingId}>
    <h2 id={headingId} data-heading-static data-scroll-fill-heading className={styles.headline}>
      <span data-scroll-fill><FillWords lines={lines} reduced={reduced} /></span>
    </h2>
  </section>;
}

export default ScrollFillHeadline;
