'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './scribble.module.css';

type Tone = 'pink' | 'lime';

/** Hand-drawn strokes in a 200×24 box; `preserveAspectRatio="none"` lets them stretch. */
const strokes = {
  underline: 'M3 15.5C30 11 58 9.6 92 10.4c31 .7 61 2.6 105 1.1M18 20.2c38-4.1 86-5.2 158-3.4',
  loop: 'M4 14c22-5.5 51-7.2 82-6.4 34 .9 70 3.2 108 1.2-34 3.9-87 6.6-131 9.1-18 1-37 2.3-50 4',
} as const;

/**
 * Wraps a phrase with a hand-drawn underline that draws itself once when it
 * scrolls into view. The stroke is decorative; the text stays plain for
 * assistive tech and copy/paste.
 */
export function Scribble({ children, tone = 'pink', variant = 'underline', className }: { children: ReactNode; tone?: Tone; variant?: keyof typeof strokes; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.dataset.drawn = 'true'; return; }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.dataset.drawn = 'true';
      io.disconnect();
    }, { rootMargin: '0px 0px -18% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} className={[styles.scribble, className].filter(Boolean).join(' ')} data-tone={tone}>
    {children}
    <svg className={styles.stroke} viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={strokes[variant]} pathLength={1} />
    </svg>
  </span>;
}

/** Short benefit statement used under each solution demo, before its CTA. */
export function BenefitNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={[styles.note, className].filter(Boolean).join(' ')}>{children}</p>;
}
