'use client';

import styles from './Refactor.module.css';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

export function ProofStrip() {
  const { t } = useLocale();
  return <section id="proof" className={styles.proof} aria-label={t('Clientes fundadores')}>
    <div className={styles.inner}>
      {landingEvidence.proof.length > 0 ? <><p>{t('Projetos e resultados')}</p><ul>{landingEvidence.proof.map(item => <li key={item.label}><strong>{t(item.label)}</strong><span>{t(item.detail)}</span></li>)}</ul></> :
        <div className={styles.founderInvite}><div><strong>{t('Clientes fundadores')}</strong><p>{t('Seu negócio pode fazer parte dos próximos projetos da ezway.')}</p></div></div>}
    </div>
  </section>;
}
