'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LayoutGroup, motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { motionTiming, motionEase } from '@/lib/motion-presets';
import { useManagementChapters } from './use-management-chapters';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { solutions } from '@/config/solutions';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import styles from './Management.module.css';
import ButtonWithIcon from '../ui/button-witn-icon';

const ManagementSimulation = dynamic(() => import('./ManagementSimulation'));

const journey = [
  { title: 'Comercial', image: '/images/crm/pipeline.png', alt: 'Tela real do CRM: pipeline comercial com Retentativas, com dados sensíveis ocultados.', description: 'Acompanhe oportunidades e saiba quem precisa de retorno.' },
  { title: 'Clientes', image: '/images/crm/clientes.png', alt: 'Tela real do CRM: lista de clientes, com dados sensíveis ocultados.', description: 'Consulte os dados e o histórico de cada cliente.' },
  { title: 'Financeiro', image: '/images/crm/financeiro.png', alt: 'Tela real do CRM: visão financeira com receitas e custos, com dados sensíveis ocultados.', description: 'Veja receitas, custos e o que falta receber.' },
];

export function Management() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [simulation, setSimulation] = useState<number | null>(null);
  useManagementChapters(stageRef, setActive);
  const step = journey[active];
  const solution = solutions.find(item => item.id === 'gestao')!;
  return <section id="gestao" aria-labelledby="management-title" className={styles.section}>
    <div className={styles.container}>
      <div ref={stageRef} className={styles.stage} data-management-stage>
      <header className={styles.header}><p className={styles.eyebrow}>{t('CONTROLE & GESTÃO')}</p><h2 data-heading-static id="management-title">{t('Seu negócio, mais organizado.')}</h2><p>{t('Acompanhe clientes, vendas e financeiro em um só lugar.')}</p></header>
      <LayoutGroup id="management-selection"><ul className={styles.journey} aria-label={t('Veja o sistema na prática')}>{journey.map((item, index) => <li key={item.title}><button data-management-tab type="button" aria-pressed={active === index} aria-controls="management-demo" onClick={() => setActive(index)}>{active === index && <motion.span className={styles.selection} layoutId="management-pill" transition={{ duration: reduced ? 0 : motionTiming.selection, ease: motionEase }} aria-hidden="true" />}<span className={styles.tabLabel}>{t(item.title)}</span></button></li>)}</ul></LayoutGroup>
      <figure className={styles.demo}>
        <div id="management-demo" className={styles.screen} aria-live="polite" aria-atomic="true">
          <Image src={step.image} alt={t(step.alt)} width={1200} height={750} sizes="(max-width: 968px) calc(100vw - 48px), 920px" quality={90} className={styles.screenshot} />
        </div>
        <figcaption><span>{t('Telas reais do CRM · dados sensíveis ocultados')}</span><a href={step.image} target="_blank" rel="noopener noreferrer">{t('Ampliar tela do CRM')} <ArrowUpRight size={14} aria-hidden="true" /></a></figcaption>
      </figure>
      <div className={styles.summary}>
        <motion.p key={active} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : motionTiming.selection, ease: motionEase }} className={styles.explanation}>{t(step.description)}</motion.p>
        <button type="button" className={styles.simulate} data-management-simulate onClick={() => setSimulation(active)}>{t('Explorar gestão')} · {t(step.title)} <ArrowUpRight size={16} aria-hidden="true" /></button>
      </div>
      </div>
      <details id="comparacao" className={styles.more}>
        <summary>{t('Mais sobre a gestão')}</summary>
        <p>{t('Oportunidades em Retentativas ficam separadas para um novo contato.')}</p>
        <div className={styles.moreLinks}>
          <a href="/images/crm/acompanhamento.png" target="_blank" rel="noopener noreferrer">{t('Ver tela de acompanhamentos')} <ArrowUpRight size={14} aria-hidden="true" /></a>
          <a href="/images/crm/vendas.png" target="_blank" rel="noopener noreferrer">{t('Ver tela de vendas')} <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </details>
      <ButtonWithIcon href={commercialHref(t(solution.message))} target="_blank" rel="noopener noreferrer" data-cta-section="gestao" data-cta-solution="gestao">{t(solution.cta)}</ButtonWithIcon>
    </div>
    {simulation !== null && <ManagementSimulation initialChapter={simulation} onDismiss={() => setSimulation(null)} />}
  </section>;
}
