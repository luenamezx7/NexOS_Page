'use client';

import Image from 'next/image';
import { solutions } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import styles from './ManagementIntro.module.css';

/** Verified management capabilities; no customer records or monetary information. */
export function ManagementIntro() {
  const { t } = useLocale();
  const management = solutions.find(solution => solution.id === 'gestao')!;
  return <figure className={styles.panel} aria-label={t('Da organização aos próximos passos do negócio')}>
    <div className={styles.heading}><Image src="/logo-ghost.svg" unoptimized style={{ filter: 'invert(1)' }} alt="" width={96} height={96} priority /><div><span>{t('EZWAY · SEU PRÓXIMO PASSO')}</span><strong>{t(management.name)}</strong></div></div>
    <ul>{management.benefits.map(benefit => <li key={benefit}><span className={styles.dot} aria-hidden="true" /><strong>{t(benefit)}</strong></li>)}</ul>
    <figcaption><a href="#gestao">{t('Veja o sistema na prática')}</a></figcaption>
  </figure>;
}
