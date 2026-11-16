'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { solutions } from '@/config/solutions';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import styles from './Management.module.css';

const journey = [
  { title: 'Comercial', image: '/images/crm/pipeline.png', alt: 'Tela real do CRM: pipeline comercial com Retentativas, com dados sensíveis ocultados.', description: 'Acompanhe oportunidades e saiba quem precisa de retorno.' },
  { title: 'Clientes', image: '/images/crm/clientes.png', alt: 'Tela real do CRM: lista de clientes, com dados sensíveis ocultados.', description: 'Consulte os dados e o histórico de cada cliente.' },
  { title: 'Financeiro', image: '/images/crm/financeiro.png', alt: 'Tela real do CRM: visão financeira com receitas e custos, com dados sensíveis ocultados.', description: 'Veja receitas, custos e o que falta receber.' },
];

export function Management() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const step = journey[active];
  const solution = solutions.find(item => item.id === 'gestao')!;
  return <section id="gestao" aria-labelledby="management-title" className={styles.section}>
    <div className={styles.container}>
      <header className={styles.header}><p className={styles.eyebrow}>{t('CONTROLE & GESTÃO')}</p><h2 data-heading-static id="management-title">{t('Seu negócio, mais organizado.')}</h2><p>{t('Acompanhe clientes, vendas e financeiro em um só lugar.')}</p></header>
      <ul className={styles.journey} aria-label={t('Veja o sistema na prática')}>{journey.map((item, index) => <li key={item.title}><button type="button" aria-pressed={active === index} aria-controls="management-demo" onClick={() => setActive(index)}>{t(item.title)}</button></li>)}</ul>
      <figure className={styles.demo}>
        <div className={styles.laptop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mackbook_1.svg" width={2180} height={1324} alt="" className={styles.frame} loading="lazy" />
          <div id="management-demo" className={styles.screen} aria-live="polite" aria-atomic="true">
            <Image src={step.image} alt={t(step.alt)} fill sizes="(max-width: 767px) 80vw, 736px" className={styles.screenshot} />
          </div>
        </div>
        <figcaption><span>{t('Telas reais do CRM · dados sensíveis ocultados')}</span><a href={step.image} target="_blank" rel="noopener noreferrer">{t('Ampliar tela do CRM')} <ArrowUpRight size={14} aria-hidden="true" /></a></figcaption>
      </figure>
      <p className={styles.explanation}>{t(step.description)}</p>
      <details id="comparacao" className={styles.more}>
        <summary>{t('Mais sobre a gestão')}</summary>
        <p>{t('Oportunidades em Retentativas ficam separadas para um novo contato.')}</p>
        <div className={styles.moreLinks}>
          <a href="/images/crm/acompanhamento.png" target="_blank" rel="noopener noreferrer">{t('Ver tela de acompanhamentos')} <ArrowUpRight size={14} aria-hidden="true" /></a>
          <a href="/images/crm/vendas.png" target="_blank" rel="noopener noreferrer">{t('Ver tela de vendas')} <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </details>
      <a href={commercialHref(t(solution.message))} target="_blank" rel="noopener noreferrer" className="btn-primary-nex" data-cta-section="gestao" data-cta-solution="gestao">{t(solution.cta)} <ArrowUpRight size={17} aria-hidden="true" /></a>
    </div>
  </section>;
}
