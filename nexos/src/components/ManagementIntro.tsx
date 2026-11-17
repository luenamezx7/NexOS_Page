'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { heroSolutionExamples } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './ManagementIntro.module.css';

export function ManagementIntro() {
  const { t } = useLocale();
  const list = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const inView = useInView(list, { amount: .25 });
  const presenting = usePresentationActive();
  const reduced = usePrefersReducedMotion();
  const active = inView && !presenting;

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setCurrent(index => (index + 1) % heroSolutionExamples.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [active]);

  const example = heroSolutionExamples[current];

  return <ul ref={list} className={styles.popups} aria-label={t('SOLUÇÕES EZWAY')} data-hero-solution-popups>
    <AnimatePresence mode="wait" initial={false}>
    <motion.li className={styles.popup} key={example.id} data-solution-popup
      initial={reduced ? false : { opacity: 0, y: 10, scale: .985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: .985, transition: { duration: .22 } }}
      transition={{ duration: reduced ? 0 : .45, ease: [.22, 1, .36, 1] }}
    >
      <span className={styles.halo} aria-hidden="true" />
      <span className={styles.surface} aria-hidden="true" />
      <span className={styles.edge} aria-hidden="true" />
      <span className={`${styles.edge} ${styles.edgeSoft}`} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.itemText} data-popup-copy>
          <span className={styles.label}>{t(example.label).split('/').map((part, index) => <span key={index}>{index > 0 && <><span>/</span><wbr /></>}{part}</span>)}</span>
          {example.note && <small className={styles.availability}>{t(example.note)}</small>}
        </span>
      </div>
    </motion.li>
    </AnimatePresence>
  </ul>;
}
