'use client';

import { ArrowUpRight } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import styles from './Refactor.module.css';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

const plans = [
  { name: 'Start', highlighted: false },
  { name: 'Pro', highlighted: true },
  { name: 'Sob medida', highlighted: false },
];

export function Plans() {
  const { t } = useLocale();
  const ready = plans.every(plan => landingEvidence.plans[plan.name]?.startingPrice && landingEvidence.plans[plan.name].inclusions.length > 0);
  return <section id="plans" className={styles.section} aria-labelledby="plans-title">
    <div className={styles.inner}>
      <ScrollReveal as="p" preset="label" className={styles.kicker}>{t('Planos')}</ScrollReveal>
      <ScrollReveal as="h2" preset="title" id="plans-title">{t('Um ponto de partida para cada projeto.')}</ScrollReveal>
       <p className={styles.explainer}>{t('Escopo, valores e condições são alinhados diretamente com você.')}</p>
      {ready ? <div className={styles.planGrid}>{plans.map(plan => <ScrollReveal as="article" preset="card" className={styles.plan} data-highlighted={plan.highlighted} key={plan.name}>
         <h3>{t(plan.name)}</h3>
         <p className={styles.price}>{t('A partir de')} <strong>{landingEvidence.plans[plan.name].startingPrice}</strong></p>
         <ul>{landingEvidence.plans[plan.name].inclusions.map(item => <li key={item}>{t(item)}</li>)}</ul>
         <a href="#contact" className={styles.planAction}>{t('Agendar conversa')} <ArrowUpRight size={18} aria-hidden="true" /></a>
       </ScrollReveal>)}</div> : <div className={styles.planPending}><p>{t('Os formatos Start, Pro e Sob medida estão em definição. Ainda não há preços ou inclusões publicados.')}</p><a href="#contact" className={styles.planAction}>{t('Agendar conversa')} <ArrowUpRight size={18} aria-hidden="true" /></a></div>}
    </div>
  </section>;
}
