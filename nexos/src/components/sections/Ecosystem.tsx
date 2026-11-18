'use client';

import { useRef } from 'react';
import { publicSolutions, type Solution } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import { StackedCards } from '@/components/ui/glass-cards';
import styles from './Ecosystem.module.css';

const chapterIds = ['site', 'menu', 'nfc', 'portfolio', 'landing', 'easychat', 'suporte'];
const chapters = chapterIds.map(id => publicSolutions.find(solution => solution.id === id)!);

export function Ecosystem() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const colors: Record<string, { color: string; ink?: string }> = {
    site: { color: '#ff78bb' }, menu: { color: 'var(--brand-lime)' }, nfc: { color: '#000000', ink: '#fffaf6' },
    portfolio: { color: '#d1c5f1' }, landing: { color: '#f6e8a9' }, easychat: { color: '#b9dcf3' }, suporte: { color: 'var(--brand-lime)' },
  };
  const cards = chapters.map((solution: Solution) => ({
    id: solution.id, title: t(solution.name), description: t(solution.need), category: t(solution.category),
    ...colors[solution.id], badge: solution.availability === 'development' ? t('Em desenvolvimento') : undefined,

  }));

  return <section id="ecossistema" aria-labelledby="ecosystem-title" className={styles.section}>
    <div className={styles.container}>
      <div ref={stageRef} className={styles.stage} data-ecosystem-stage>
      <h2 data-heading-static id="ecosystem-title">{t('Além da gestão.')}</h2>
      <p className={styles.lead}>{t('Sites, cardápios e placas para apresentar seu negócio e facilitar o contato.')}</p>
      <StackedCards items={cards} stageRef={stageRef} />
      </div>
      <p className={styles.note}>{t('Você escolhe o que precisa. O escopo é combinado no diagnóstico.')}</p>
    </div>
  </section>;
}
