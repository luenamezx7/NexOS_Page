'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import { ArrowUpRight, Check } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DELIVERY_STEPS } from './landing-content';
import styles from './Sections.module.css';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

export function DeliveryProcess() {
  const { t } = useLocale();
  const [kind, setKind] = useState<keyof typeof DELIVERY_STEPS>('service');
  const [pinned, setPinned] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const media = motionMedia('(min-width: 768px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPinned(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // One rect read per frame, only while the section intersects the viewport.
  // (Replaces two Motion useScroll trackers that walked the offsetParent chain
  // on every scroll frame, visible or not.)
  useEffect(() => {
    const section = sectionRef.current, timeline = timelineRef.current;
    if (!section || !timeline) return;
    const steps = DELIVERY_STEPS[kind].length;
    let frame = 0, visible = false;
    const measure = () => {
      frame = 0;
      const vh = innerHeight;
      let progress: number;
      if (pinned) {
        // offset ['start start', 'end end'] of the section
        const r = section.getBoundingClientRect();
        progress = r.height > vh ? -r.top / (r.height - vh) : r.top <= 0 ? 1 : 0;
      } else {
        // offset ['start center', 'end center'] of the timeline
        const r = timeline.getBoundingClientRect();
        progress = (vh / 2 - r.top) / Math.max(1, r.height);
      }
      const next = Math.max(0, Math.min(steps - 1, Math.floor(Math.max(0, Math.min(1, progress)) * steps)));
      setActiveStep(previous => previous === next ? previous : next);
    };
    const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(measure); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    observer.observe(section);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    visible = true; schedule();
    return () => { observer.disconnect(); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [kind, pinned]);
  return <section ref={sectionRef} id="delivery-process" aria-labelledby="delivery-title" className={`${styles.section} ${styles.processSection}`}>
    <div className={`${styles.container} ${styles.processContainer}`}>
      <div className={styles.processStage}>
       <header className={styles.splitHeader}><ScrollReveal as="h2" preset="title" id="delivery-title" className={styles.heading}>{t('De ponta a ponta.')}<br /><span>{t('Com você.')}</span></ScrollReveal>
         <ScrollReveal delay={.08}><p className={styles.lead}>{t('Você acompanha o caminho. Cada etapa tem um propósito e um ponto de conversa.')}</p>
           <FieldSet className={styles.processSwitch}><FieldLegend className="sr-only">{t('Tipo de entrega')}</FieldLegend><FieldGroup className={styles.segmented}>
             <label data-selected={kind === 'product'}><input type="radio" name="delivery-kind" checked={kind === 'product'} onChange={() => setKind('product')} />{t('Produto físico')}</label>
             <label data-selected={kind === 'service'}><input type="radio" name="delivery-kind" checked={kind === 'service'} onChange={() => setKind('service')} />{t('Serviço digital')}</label>
          </FieldGroup></FieldSet>
        </ScrollReveal>
      </header>
        <p className={styles.processCounter} aria-hidden="true">{t('Etapa')} {String(activeStep + 1).padStart(2, '0')} / {String(DELIVERY_STEPS[kind].length).padStart(2, '0')}</p>
        <ol ref={timelineRef} className={styles.timeline} data-pinned={pinned} aria-label={t(kind === 'product' ? 'Processo do produto físico' : 'Processo do serviço digital')}>
         {DELIVERY_STEPS[kind].map((step, i) => <li key={step.title} data-active={i === activeStep} data-complete={i < activeStep} aria-current={i === activeStep ? 'step' : undefined}>
          <span className={styles.stepMarker}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.stepDetail}>{t(step.detail)}</span><h3>{t(step.title)}</h3><p>{t(step.body)}</p>{landingEvidence.durations[kind][i] && <small>{t('Prazo estimado')}: {landingEvidence.durations[kind][i]}</small>}
          <span className={styles.stepEnd} aria-hidden="true">{i === 3 ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>
        </li>)}
       </ol>
        <ScrollReveal className={styles.processFoot}><span>{t('Escopo e prazos são alinhados para cada pedido.')}</span></ScrollReveal>
      </div>
    </div>
  </section>;
}
