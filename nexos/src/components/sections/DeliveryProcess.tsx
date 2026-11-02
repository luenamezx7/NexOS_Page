'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, type MotionStyle } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ScrollReveal } from '../ScrollReveal';
import { ArrowUpRight, Check } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DELIVERY_STEPS } from './landing-content';
import styles from './Sections.module.css';

export function DeliveryProcess() {
  const [kind, setKind] = useState<keyof typeof DELIVERY_STEPS>('product');
  const [pinned, setPinned] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  useEffect(() => {
    const media = matchMedia('(min-width: 768px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPinned(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useMotionValueEvent(scrollYProgress, 'change', progress => {
    if (pinned) setActiveStep(previous => {
      const next = Math.min(DELIVERY_STEPS[kind].length - 1, Math.floor(progress * DELIVERY_STEPS[kind].length));
      return previous === next ? previous : next;
    });
  });
  return <section ref={sectionRef} id="delivery-process" aria-labelledby="delivery-title" className={`${styles.section} ${styles.processSection}`}>
    <div className={`${styles.container} ${styles.processContainer}`}>
      <div className={styles.processStage}>
      <header className={styles.splitHeader}><ScrollReveal as="h2" preset="title" id="delivery-title" className={styles.heading}>De ponta a ponta.<br /><span>Com você.</span></ScrollReveal>
        <ScrollReveal delay={.08}><p className={styles.lead}>Você acompanha o caminho. Cada etapa tem um propósito e um ponto de conversa.</p>
          <FieldSet className={styles.processSwitch}><FieldLegend className="sr-only">Tipo de entrega</FieldLegend><FieldGroup className={styles.segmented}>
            <label data-selected={kind === 'product'}><input type="radio" name="delivery-kind" checked={kind === 'product'} onChange={() => setKind('product')} />Produto físico</label>
            <label data-selected={kind === 'service'}><input type="radio" name="delivery-kind" checked={kind === 'service'} onChange={() => setKind('service')} />Serviço digital</label>
          </FieldGroup></FieldSet>
        </ScrollReveal>
      </header>
      {pinned && <p className={styles.processCounter} aria-hidden="true">Etapa {String(activeStep + 1).padStart(2, '0')} / {String(DELIVERY_STEPS[kind].length).padStart(2, '0')}</p>}
      <motion.ol className={styles.timeline} data-pinned={pinned} style={{ '--process-progress': reduce ? 1 : scrollYProgress } as MotionStyle} aria-label={kind === 'product' ? 'Processo do produto físico' : 'Processo do serviço digital'}>
        {DELIVERY_STEPS[kind].map((step, i) => <li key={step.title} data-active={pinned && i === activeStep} aria-current={pinned && i === activeStep ? 'step' : undefined}>
          <span className={styles.stepMarker}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.stepDetail}>{step.detail}</span><h3>{step.title}</h3><p>{step.body}</p>
          <span className={styles.stepEnd} aria-hidden="true">{i === 3 ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>
        </li>)}
      </motion.ol>
      <ScrollReveal className={styles.processFoot}><span>Escopo e prazos são alinhados para cada pedido.</span><a href="#cta-final">Vamos alinhar o seu? <ArrowUpRight size={16} aria-hidden="true" /></a></ScrollReveal>
      </div>
    </div>
  </section>;
}
