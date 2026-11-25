'use client';

import * as React from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './scroll-fill-headline.module.css';

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  // Inherit the section's ink so the same fill works on light and dark surfaces.
  const opacity = useTransform(progress, range, [.6, 1]);
  return <motion.span style={{ opacity }} className={styles.word} data-scroll-fill-word>{word}</motion.span>;
}

export interface FloatingObject {
  src: string;
  left: number;
  top: number;
  width: number;
  rotate: [number, number];
  drift: [number, number];
}

export interface ScrollFillHeadlineProps {
  lines: [string, string];
  objects?: FloatingObject[];
  className?: string;
  id?: string;
}

function Floater({ object, progress }: { object: FloatingObject; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], object.drift);
  const rotate = useTransform(progress, [0, 1], object.rotate);
  // Optional decorative artwork keeps the supplied component's API.
  return <motion.img src={object.src} alt="" aria-hidden="true" className={styles.floater} style={{ left: `${object.left}%`, top: `${object.top}%`, width: object.width, y, rotate }} />;
}

function FillWords({ lines, progress }: { lines: readonly string[]; progress: MotionValue<number> }) {
  const reduced = usePrefersReducedMotion();
  const total = lines.reduce((count, line) => count + line.trim().split(/\s+/).length, 0);
  let index = 0;
  return <>{lines.map((line, lineIndex) => <span className={styles.line} key={lineIndex}>
    {line.trim().split(/\s+/).map((word, wordIndex) => {
      const current = index++;
      return <React.Fragment key={wordIndex}>
        {reduced ? <span>{word}</span> : <Word word={word} progress={progress} range={[current / total, Math.min(1, (current + 1.5) / total)]} />}
        {' '}
      </React.Fragment>;
    })}
  </span>)}</>;
}

/** The word-fill treatment for an existing heading, without nesting headings. */
export function ScrollFillText({ lines, className }: { lines: readonly string[]; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 45%'] });
  return <span ref={ref} className={cn(styles.text, className)} data-scroll-fill>
    <FillWords lines={lines} progress={scrollYProgress} />
  </span>;
}

export function ScrollFillHeadline({ lines, objects = [], className, id }: ScrollFillHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  const generatedId = React.useId();
  const headingId = `${id ?? generatedId}-title`;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 45%'] });
  return <section ref={ref} id={id} className={cn(styles.section, className)} aria-labelledby={headingId}>
    {objects.map((object, index) => <Floater key={index} object={object} progress={scrollYProgress} />)}
    <h2 id={headingId} data-heading-static data-scroll-fill-heading className={styles.headline}>
      <span data-scroll-fill><FillWords lines={lines} progress={scrollYProgress} /></span>
    </h2>
  </section>;
}

export default ScrollFillHeadline;
