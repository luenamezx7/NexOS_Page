'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';
import styles from './text-scroll-animation.module.css';

function Character({ char, index, center, localDistance, compact, progress }: { char: string; index: number; center: number; localDistance: number; compact: boolean; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const distance = index - center;
  const x = useTransform(progress, [0, 1], [compact ? localDistance * 2 : distance * 10, 0]);
  const y = useTransform(progress, [0, 1], [compact ? Math.abs(localDistance) * 4 : Math.abs(distance) * 5, 0]);
  const opacity = useTransform(progress, [0, .8], [.25, 1]);
  return <motion.span className={styles.character} style={{ x, y, opacity }}>{char}</motion.span>;
}

/** Compact adaptation of the supplied scroll-character idea. Lenis is owned by the site. */
export function TextScrollAnimation({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = matchMedia('(max-width: 767px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 40%'] });
  const words = text.trim().split(/\s+/);
  let characterIndex = 0;
  return <section ref={ref} aria-label={text} className={cn(styles.bridge, className)}>
    <p aria-hidden="true" className={compact && !reduce ? styles.mobileWords : undefined}>{reduce ? text : words.map((word, wordIndex) => <span className={styles.word} key={wordIndex}>{Array.from(word).map((char, localIndex) => {
      const index = characterIndex++;
      return <Character key={index} char={char} index={index} center={(text.length - 1) / 2} localDistance={localIndex - (word.length - 1) / 2} compact={compact} progress={scrollYProgress} />;
    })}{wordIndex < words.length - 1 && <span className={styles.space}> </span>}</span>)}</p>
  </section>;
}
