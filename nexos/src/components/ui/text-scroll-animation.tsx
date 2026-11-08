'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';
import styles from './text-scroll-animation.module.css';

function Character({ char, index, center, progress }: { char: string; index: number; center: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const distance = index - center;
  const x = useTransform(progress, [0, 1], [distance * 10, 0]);
  const y = useTransform(progress, [0, 1], [Math.abs(distance) * 5, 0]);
  const opacity = useTransform(progress, [0, .8], [.25, 1]);
  return <motion.span className={styles.character} style={{ x, y, opacity }}>{char === ' ' ? '\u00a0' : char}</motion.span>;
}

/** Compact adaptation of the supplied scroll-character idea. Lenis is owned by the site. */
export function TextScrollAnimation({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 40%'] });
  const chars = Array.from(text);
  return <section ref={ref} aria-label={text} className={cn(styles.bridge, className)}>
    <p aria-hidden="true">{reduce ? text : chars.map((char, index) => <Character key={index} char={char} index={index} center={(chars.length - 1) / 2} progress={scrollYProgress} />)}</p>
  </section>;
}
