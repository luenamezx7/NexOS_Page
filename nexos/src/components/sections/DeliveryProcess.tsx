'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, type MotionStyle } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ScrollReveal } from '../ScrollReveal';
import { ArrowUpRight, Check } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DELIVERY_STEPS } from './landing-content';
import styles from './Sections.module.css';

export function DeliveryProcess() {
  const [kind, setKind] = useState<keyof typeof DELIVERY_STEPS>('product');
  const timelineRef = useRef<HTMLOListElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start .9', 'end .45'] });
  return <section id="delivery-process" aria-labelledby="delivery-title" className={styles.section}>
    <div className={styles.container}>
      <ScrollReveal preset="label" className={styles.eyebrow}><span>05 / COMO ACONTECE</span><span>DA IDEIA À ENTREGA</span></ScrollReveal>
      <header className={styles.splitHeader}><ScrollReveal as="h2" preset="title" id="delivery-title" className={styles.heading}>De ponta a ponta.<br /><span>Com você.</span></ScrollReveal>
        <ScrollReveal delay={.08}><p className={styles.lead}>Você acompanha o caminho. Cada etapa tem um propósito e um ponto de conversa.</p>
          <FieldSet className={styles.processSwitch}><FieldLegend className="sr-only">Tipo de entrega</FieldLegend><FieldGroup className={styles.segmented}>
            <label data-selected={kind === 'product'}><input type="radio" name="delivery-kind" checked={kind === 'product'} onChange={() => setKind('product')} />Produto físico</label>
            <label data-selected={kind === 'service'}><input type="radio" name="delivery-kind" checked={kind === 'service'} onChange={() => setKind('service')} />Serviço digital</label>
          </FieldGroup></FieldSet>
        </ScrollReveal>
      </header>
      <motion.ol ref={timelineRef} key={kind} className={styles.timeline} style={{ '--process-progress': reduce ? 1 : scrollYProgress } as MotionStyle} aria-label={kind === 'product' ? 'Processo do produto físico' : 'Processo do serviço digital'}>
        {DELIVERY_STEPS[kind].map((step, i) => <ScrollReveal as="li" key={step.title} delay={i * .08}>
          <span className={styles.stepMarker}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.stepDetail}>{step.detail}</span><h3>{step.title}</h3><p>{step.body}</p>
          <span className={styles.stepEnd} aria-hidden="true">{i === 3 ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>
        </ScrollReveal>)}
      </motion.ol>
      <ScrollReveal className={styles.processFoot}><span>Escopo e prazos são alinhados para cada pedido.</span><a href="#cta-final">Vamos alinhar o seu? <ArrowUpRight size={16} aria-hidden="true" /></a></ScrollReveal>
    </div>
  </section>;
}
