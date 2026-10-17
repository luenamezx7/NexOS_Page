'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DELIVERY_STEPS } from './landing-content';
import styles from './Sections.module.css';

export function DeliveryProcess() {
  const [kind, setKind] = useState<keyof typeof DELIVERY_STEPS>('product');
  const reduce = useReducedMotion();
  return <section id="delivery-process" aria-labelledby="delivery-title" className={styles.section}>
    <div className={styles.container}>
      <div className={`${styles.eyebrow} topography-glass topography-glass--compact`}><span>05 / COMO ACONTECE</span><span>DA IDEIA À ENTREGA</span></div>
      <header className={`${styles.splitHeader} topography-glass topography-glass--copy`}><h2 id="delivery-title" className={styles.heading}>De ponta a ponta.<br /><span>Com você.</span></h2>
        <div><p className={styles.lead}>Você acompanha o caminho. Cada etapa tem um propósito e um ponto de conversa.</p>
          <FieldSet className={styles.processSwitch}><FieldLegend className="sr-only">Tipo de entrega</FieldLegend><FieldGroup className={styles.segmented}>
            <label data-selected={kind === 'product'}><input type="radio" name="delivery-kind" checked={kind === 'product'} onChange={() => setKind('product')} />Produto físico</label>
            <label data-selected={kind === 'service'}><input type="radio" name="delivery-kind" checked={kind === 'service'} onChange={() => setKind('service')} />Serviço digital</label>
          </FieldGroup></FieldSet>
        </div>
      </header>
      <ol key={kind} className={`${styles.timeline} topography-glass topography-glass--copy`} aria-label={kind === 'product' ? 'Processo do produto físico' : 'Processo do serviço digital'}>
        {DELIVERY_STEPS[kind].map((step, i) => <motion.li key={step.title} initial={reduce ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, delay: i * 0.13, ease: [0.16, 1, 0.3, 1] }}>
          <span className={styles.stepMarker}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.stepDetail}>{step.detail}</span><h3>{step.title}</h3><p>{step.body}</p>
          <span className={styles.stepEnd} aria-hidden="true">{i === 3 ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>
        </motion.li>)}
      </ol>
      <div className={`${styles.processFoot} topography-glass topography-glass--compact`}><span>Escopo e prazos são alinhados para cada pedido.</span><a href="#contact">Vamos alinhar o seu? <ArrowUpRight size={16} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
