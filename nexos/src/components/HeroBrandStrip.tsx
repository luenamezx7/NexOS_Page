'use client';

import { useRef, useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { useInView } from 'motion/react';
import { Marquee } from './marquee';
import styles from './HeroBrandStrip.module.css';

const BRAND_PILLARS = ['Sites', 'Portfólios', 'Landing pages', 'Cardápios digitais', 'Placas NFC', 'QR Code'];

export function HeroBrandStrip({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.01 });
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return <div ref={ref} role="region" aria-label="Pilares da NexOS" className={styles.strip} data-hero-brand-strip data-running={active && visible && !paused && !hidden}>
    <Marquee duration={32} pauseOnHover direction="left" fade fadeAmount={12} className={styles.viewport}>
      {BRAND_PILLARS.map(pillar => <span className={styles.item} key={pillar}><span className={styles.spark} aria-hidden="true" />{pillar}</span>)}
    </Marquee>
    <button type="button" className={styles.control} aria-label={paused ? 'Retomar faixa' : 'Pausar faixa'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}</button>
  </div>;
}
