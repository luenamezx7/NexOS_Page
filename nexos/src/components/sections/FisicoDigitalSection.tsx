'use client';

import { useLocale } from '@/lib/locale';
import { HighlightedText } from '../highlighted-text';
import styles from './Sections.module.css';

/** A short bridge between the hero and the product choices. */
export function FisicoDigitalSection() {
  const { t } = useLocale();
  return <section id="fisico-digital" aria-labelledby="fisico-title" className={`${styles.section} ${styles.productBridge}`}>
    <div className={styles.container}>
       <h2 id="fisico-title">{t('Seu cardápio')} <HighlightedText inView from="left" delay={.12}>{t('já está na mesa.')}</HighlightedText></h2>
      <p>{t('O cliente aproxima o celular da placa ou escaneia o QR Code para ver os pratos e os preços.')}</p>
    </div>
  </section>;
}
