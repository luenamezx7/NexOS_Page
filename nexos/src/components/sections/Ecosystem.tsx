'use client';

import { publicSolutions, type Solution } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import styles from './Ecosystem.module.css';

const primaryIds = new Set(['site', 'menu', 'nfc']);

export function Ecosystem() {
  const { t } = useLocale();
  const card = (solution: Solution) => <article key={solution.id} className={styles.card} data-solution={solution.id}>
    {solution.availability === 'development' && <p className={styles.category}>{t('Em desenvolvimento')}</p>}
    <h3 data-heading-static>{t(solution.name)}</h3>
    <p>{t(solution.need)}</p>
    <details><summary>{t('Saiba mais')}</summary><div className={styles.detail}>
      <p>{t(solution.audience)}</p>
      <p><strong>{t('O que entrega:')}</strong> {solution.deliveries.map(t).join(' · ')}</p>
      <p><strong>{t('Exemplo ilustrativo:')}</strong> {t(solution.example)}</p>
      <p>{t(solution.limits)}</p>
    </div></details>
  </article>;

  return <section id="ecossistema" aria-labelledby="ecosystem-title" className={styles.section}>
    <div className={styles.container}>
      <h2 data-heading-static id="ecosystem-title">{t('Além da gestão.')}</h2>
      <p className={styles.lead}>{t('Sites, cardápios e placas para apresentar seu negócio e facilitar o contato.')}</p>
      <div className={`${styles.catalogue} ${styles.primaryCatalogue}`}>{publicSolutions.filter(solution => primaryIds.has(solution.id)).map(card)}</div>
      <details className={styles.moreSolutions}>
        <summary>{t('Ver todas as soluções')}</summary>
        <div className={styles.catalogue}>{publicSolutions.filter(solution => !primaryIds.has(solution.id)).map(card)}</div>
      </details>
      <p className={styles.note}>{t('Você escolhe o que precisa. O escopo é combinado no diagnóstico.')}</p>
    </div>
  </section>;
}
