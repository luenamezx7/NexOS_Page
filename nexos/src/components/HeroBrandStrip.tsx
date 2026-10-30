'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useInView } from 'motion/react';
import styles from './HeroBrandStrip.module.css';

const BRAND_PILLARS = [
  'Design com identidade',
  'Código sob medida',
  'IA aplicada ao negócio',
  'NFC + QR Code',
  'Do físico ao digital',
  'Tecnologia com propósito',
];

export function HeroBrandStrip({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.01 });
  const [paused, setPaused] = useState(false);

  return (
    <div ref={ref} role="region" aria-label="Pilares da NexOS" className={styles.strip} data-hero-brand-strip data-running={active && visible && !paused}>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {[false, true].map(duplicate => (
            <ul key={String(duplicate)} className={styles.group} aria-hidden={duplicate || undefined}>
              {BRAND_PILLARS.map(pillar => (
                <li key={pillar}><span className={styles.spark} aria-hidden="true" />{pillar}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.control}
        aria-label={paused ? 'Retomar faixa' : 'Pausar faixa'}
        aria-pressed={paused}
        onClick={() => setPaused(value => !value)}
      >
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
      </button>
    </div>
  );
}
