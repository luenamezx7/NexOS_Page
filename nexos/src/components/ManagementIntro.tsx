'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { heroSolutionExamples } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { useDocumentVisible } from '@/lib/use-document-visible';
import { motionTiming } from '@/lib/motion-presets';
import styles from './ManagementIntro.module.css';

export function ManagementIntro() {
  const { t } = useLocale();
  const list = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const inView = useInView(list, { amount: .25 });
  const presenting = usePresentationActive();
  const visible = useDocumentVisible();
  const active = inView && !presenting && visible;

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setCurrent(index => (index + 1) % heroSolutionExamples.length);
    }, motionTiming.popupInterval);
    return () => window.clearInterval(interval);
  }, [active]);

  const example = heroSolutionExamples[current];
  return <ul ref={list} className={styles.popups} aria-label={t('SOLUÇÕES EZWAY')} aria-live="off" data-hero-solution-popups data-reveal={active}>
    <li className={styles.popup} data-solution-popup>
      <span key={example.id} className={styles.itemText} data-popup-copy>
        <span className={styles.label}>{t(example.label).split('/').map((part, index) => <span key={index}>{index > 0 && <><span>/</span><wbr /></>}{part}</span>)}</span>
        {example.note && <small className={styles.availability}>{t(example.note)}</small>}
      </span>
    </li>
  </ul>;
}
