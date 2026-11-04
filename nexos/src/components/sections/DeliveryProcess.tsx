'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { ScrollReveal } from '../ScrollReveal';
import { ArrowUpRight, Check } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DELIVERY_STEPS } from './landing-content';
import styles from './Sections.module.css';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

export function DeliveryProcess() {
  const { t } = useLocale();
  const [kind, setKind] = useState<keyof typeof DELIVERY_STEPS>('product');
  const [pinned, setPinned] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const { scrollYProgress: timelineProgress } = useScroll({ target: timelineRef, offset: ['start center', 'end center'] });
  useEffect(() => {
    const media = matchMedia('(min-width: 768px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPinned(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const updateStep = useCallback((progress: number) => {
    const next = Math.max(0, Math.min(DELIVERY_STEPS[kind].length - 1, Math.floor(progress * DELIVERY_STEPS[kind].length)));
    setActiveStep(previous => previous === next ? previous : next);
  }, [kind]);
  useMotionValueEvent(scrollYProgress, 'change', progress => { if (pinned) updateStep(progress); });
  useMotionValueEvent(timelineProgress, 'change', progress => { if (!pinned) updateStep(progress); });
  useEffect(() => {
    const frame = requestAnimationFrame(() => updateStep((pinned ? scrollYProgress : timelineProgress).get()));
    return () => cancelAnimationFrame(frame);
  }, [pinned, scrollYProgress, timelineProgress, updateStep]);
  return <section ref={sectionRef} id="delivery-process" aria-labelledby="delivery-title" className={`${styles.section} ${styles.processSection}`}>
    <div className={`${styles.container} ${styles.processContainer}`}>
      <div className={styles.processStage}>
      <header className={styles.splitHeader}><ScrollReveal as="h2" preset="title" id="delivery-title" className={styles.heading}>De ponta a ponta.<br /><span>Com você.</span></ScrollReveal>
        <ScrollReveal delay={.08}><p className={styles.lead}>Você acompanha o caminho. Cada etapa tem um propósito e um ponto de conversa.</p>
           <FieldSet className={styles.processSwitch}><FieldLegend className="sr-only">{t('Tipo de entrega')}</FieldLegend><FieldGroup className={styles.segmented}>
             <label data-selected={kind === 'product'}><input type="radio" name="delivery-kind" checked={kind === 'product'} onChange={() => setKind('product')} />{t('Produto físico')}</label>
             <label data-selected={kind === 'service'}><input type="radio" name="delivery-kind" checked={kind === 'service'} onChange={() => setKind('service')} />{t('Serviço digital')}</label>
          </FieldGroup></FieldSet>
        </ScrollReveal>
      </header>
        <p className={styles.processCounter} aria-hidden="true">{t('Etapa')} {String(activeStep + 1).padStart(2, '0')} / {String(DELIVERY_STEPS[kind].length).padStart(2, '0')}</p>
        <ol ref={timelineRef} className={styles.timeline} data-pinned={pinned} aria-label={t(kind === 'product' ? 'Processo do produto físico' : 'Processo do serviço digital')}>
         {DELIVERY_STEPS[kind].map((step, i) => <li key={step.title} data-active={i === activeStep} aria-current={i === activeStep ? 'step' : undefined}>
          <span className={styles.stepMarker}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.stepDetail}>{t(step.detail)}</span><h3>{t(step.title)}</h3><p>{t(step.body)}</p>{landingEvidence.durations[kind][i] && <small>{t('Prazo estimado')}: {landingEvidence.durations[kind][i]}</small>}
          <span className={styles.stepEnd} aria-hidden="true">{i === 3 ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>
        </li>)}
       </ol>
      <ScrollReveal className={styles.processFoot}><span>Escopo e prazos são alinhados para cada pedido.</span><a href="#cta-final">Vamos alinhar o seu? <ArrowUpRight size={16} aria-hidden="true" /></a></ScrollReveal>
      </div>
    </div>
  </section>;
}
