'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { Nfc, QrCode } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import styles from './Commerce.module.css';

const STUDIES = [
  { id: 'blue', title: 'Azul técnico', code: 'NX / 01' },
  { id: 'violet', title: 'Violeta digital', code: 'NX / 02' },
  { id: 'mono', title: 'Monocromático', code: 'NX / 03' },
] as const;

export function PlateFan() {
  const [selected, setSelected] = useState<string>('blue');
  const reduce = useReducedMotion();
  return <div className={styles.plateStage}>
    <div className={styles.stageTop}><span>NEXOS / PHYSICAL INTERFACE</span><Nfc size={18} aria-hidden="true" /></div>
    <div id="plate-studies" className={styles.fanArea}>
      <FieldSet><FieldLegend className="sr-only">Prévias visuais da placa</FieldLegend><FieldGroup className={styles.fanCards}>
        {STUDIES.map((study, i) => <motion.label key={study.id} className={styles.fanCard} data-study={study.id} data-selected={selected === study.id}
          initial={reduce ? false : { opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: selected === study.id ? -18 : 0, rotate: (i - 1) * 12 }}
          whileHover={reduce ? undefined : { scale: 1.04 }} whileTap={reduce ? undefined : { scale: 0.98 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22, delay: i * 0.05 }}>
          <input type="radio" aria-label={study.title} name="plate-study" value={study.id} checked={selected === study.id} onChange={() => setSelected(study.id)} />
          <span className={styles.studyCode}>{study.code}<Nfc size={18} aria-hidden="true" /></span>
          <strong>NEXOS<span>SUA MARCA AQUI</span></strong>
          <QrCode className={styles.studyQr} size={52} strokeWidth={1} aria-hidden="true" />
          <span className={styles.studyName}>{study.title}</span>
        </motion.label>)}
      </FieldGroup></FieldSet>
    </div>
    <div className={styles.stageFoot}><span><span className={styles.stageDot} /> Estudos de identidade</span><span>NFC + QR</span></div>
    <p className={styles.studyDisclaimer} aria-live="polite">{STUDIES.find(s => s.id === selected)?.title}: prévia ilustrativa. A personalização final é combinada com a NexOS.</p>
  </div>;
}
