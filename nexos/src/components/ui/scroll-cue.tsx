'use client';

import { useEffect, useRef } from 'react';
import styles from './scroll-cue.module.css';

/**
 * A quiet, decorative nudge placed in the breathing room between sections.
 * Transform/opacity only (compositor), paused while off-screen, hidden from
 * assistive tech and still for reduced motion.
 */
export function ScrollCue({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { el.dataset.active = e.isIntersecting ? 'true' : 'false'; });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} className={[styles.cue, className].filter(Boolean).join(' ')} data-tone={tone} data-active="false" aria-hidden="true">
    <svg viewBox="0 0 24 36" width="18" height="27" fill="none">
      <path d="M12 3v24" />
      <path d="M5 21l7 7 7-7" />
    </svg>
  </span>;
}
