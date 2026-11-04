'use client';

import { useLocale } from '@/lib/locale';
import styles from './LanguageSwitch.module.css';

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const next = locale === 'pt' ? 'en' : 'pt';
  return <button type="button" className={styles.switch} onClick={() => setLocale(next)} aria-label={locale === 'pt' ? 'Switch to English' : 'Mudar para português'} title={locale === 'pt' ? 'Switch to English' : 'Mudar para português'}>
    <span aria-hidden="true">{locale.toUpperCase()}</span><span className={styles.separator} aria-hidden="true">/</span><span className={styles.next} aria-hidden="true">{next.toUpperCase()}</span>
  </button>;
}
