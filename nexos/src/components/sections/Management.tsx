'use client';


import { solutions } from '@/config/solutions';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import { Button } from '../ui/cnippet-button';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import styles from './Management.module.css';
import { ManagementPreview } from './ManagementPreview';
import { ScrollCue } from '../ui/scroll-cue';
import { BenefitNote, Scribble } from '../ui/scribble';

export function Management() {
  const { t } = useLocale();

  const solution = solutions.find(item => item.id === 'gestao')!;
  return <section id="gestao" aria-labelledby="management-title" className={styles.section}>
    <div className={styles.container} data-management-stage>
      <header className={styles.header}>
        <h2 data-heading-static data-scroll-fill-heading id="management-title"><ScrollFillText lines={[t('Seu negócio, mais organizado.')]} /></h2>
        <p>{t('Acompanhe clientes, vendas e financeiro em um só lugar.')}</p>
      </header>
      <div className={styles.demo} id="management-demo"><ManagementPreview /></div>
      <BenefitNote>{t('Você sabe quem atender, o que vender e quanto entra no caixa —')} <Scribble tone="lime">{t('sem planilha perdida')}</Scribble>.</BenefitNote>
      <div className={styles.action}>
        <Button variant="secondary" size="xl" render={<a href={commercialHref(t(solution.message))} target="_blank" rel="noopener noreferrer" />} data-cta-section="gestao" data-cta-solution="gestao">{t(solution.cta)}</Button>
      </div>
      <ScrollCue />
    </div>
  </section>;
}
