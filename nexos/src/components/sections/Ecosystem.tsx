'use client';

import { useRef } from 'react';
import { publicSolutions, type Solution } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import { StackedCards } from '@/components/ui/glass-cards';
import styles from './Ecosystem.module.css';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import { ChapterPreview } from './EcosystemPreviews';
import { ScrollCue } from '../ui/scroll-cue';

const chapterIds = ['site', 'menu', 'nfc', 'portfolio', 'landing', 'easychat', 'suporte'];
const chapters = chapterIds.map(id => publicSolutions.find(solution => solution.id === id)!);

export function Ecosystem() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  // Black, premium surfaces. Each card keeps its former hue as an accent only:
  // eyebrow dot, index and a static corner light. Slight tonal steps keep the
  // stacked edges readable against each other.
  const accents: Record<string, string> = {
    site: '#ff78bb', menu: 'var(--brand-lime)', nfc: '#ff3f9f', portfolio: '#cbbcf5', landing: '#f6e3a1', easychat: '#9fd3f5', suporte: 'var(--brand-lime)',
  };
  const surfaces = ['#111111', '#151515', '#121212', '#161616', '#111111', '#141414', '#121212'];
  const cards = chapters.map((solution: Solution, index) => ({
    id: solution.id, title: t(solution.name), description: t(solution.need), category: t(solution.category),
    color: surfaces[index % surfaces.length], ink: '#f4f2ef', accent: accents[solution.id],
    badge: solution.availability === 'development' ? t('Em desenvolvimento') : undefined,
    children: <ChapterPreview solution={solution} />,
  }));

  return <section id="ecossistema" aria-labelledby="ecosystem-title" className={styles.section}>
    <div className={styles.container}>
      <div ref={stageRef} className={styles.stage} data-ecosystem-stage>
      <h2 data-heading-static data-scroll-fill-heading id="ecosystem-title"><ScrollFillText lines={[t('Além da gestão.')]} /></h2>
      <p className={styles.lead}>{t('Sites, cardápios e placas para apresentar seu negócio e facilitar o contato.')}</p>
      <StackedCards items={cards} stageRef={stageRef} />
      </div>
      <p className={styles.note}>{t('Você escolhe o que precisa. O escopo é combinado no diagnóstico.')}</p>
      <ScrollCue tone="dark" />
    </div>
  </section>;
}
