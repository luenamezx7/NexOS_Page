'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ArrowUpRight, Layers, Nfc, QrCode, X } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import styles from './Commerce.module.css';

const STUDIES = [
  { id: 'blue', title: 'Azul técnico', code: 'NX / 01' },
  { id: 'violet', title: 'Violeta digital', code: 'NX / 02' },
  { id: 'mono', title: 'Monocromático', code: 'NX / 03' },
] as const;

export function PlateFan() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('blue');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (open) fanRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true });
    else if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);
  return <div className={styles.plateStage} data-expanded={open}>
    <div className={styles.stageTop}><span>NEXOS / PHYSICAL INTERFACE</span><Nfc size={18} aria-hidden="true" /></div>
    {!open ? <button ref={triggerRef} type="button" className={styles.plateImageButton} onClick={() => setOpen(true)} aria-expanded={false} aria-label="Abrir leque de identidades da placa">
      <Image src="/placas/codex-1.png" alt="Placa Inteligente NexOS de acrílico, com NFC e QR Code, segurada em mãos" fill sizes="(max-width: 899px) 100vw, 50vw" />
      <span className={styles.previewBadge}><Layers size={16} aria-hidden="true" /> Explore as identidades <ArrowUpRight size={16} aria-hidden="true" /></span>
    </button> : <div ref={fanRef} id="plate-studies" className={styles.fanArea} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }}>
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
      <button type="button" className={styles.closeFan} onClick={() => setOpen(false)}><X size={15} aria-hidden="true" /> Fechar leque</button>
    </div>}
    <div className={styles.stageFoot}><span><span className={styles.stageDot} /> {open ? 'Estudos de identidade' : 'Uma placa. Muitas possibilidades.'}</span><span>NFC + QR</span></div>
    <p className={styles.studyDisclaimer} aria-live="polite">{open ? `${STUDIES.find(s => s.id === selected)?.title}: prévia ilustrativa. A personalização final é combinada com a NexOS.` : 'Clique na placa para abrir o leque de prévias visuais.'}</p>
  </div>;
}
