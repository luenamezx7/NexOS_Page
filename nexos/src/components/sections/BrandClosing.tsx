'use client';

import { ScrollReveal } from '../ScrollReveal';
import { BrandWordmark } from '../BrandWordmark';
import styles from './BrandClosing.module.css';
import { useLocale } from '@/lib/locale';

/** A typographic closing scene, inspired by -/ref-name.png in the ezway palette. */
export function BrandClosing() {
  const { t } = useLocale();
  return <section id="brand-closing" className={styles.closing} aria-label={t('ezway — Design, código e conexão')}>
    <ScrollReveal as="p" preset="label" className={styles.closingCaption}>{t('Feito pela ezway')}</ScrollReveal>
    <div className={styles.wordmarkCrop}>
      <a href="#hero" className={styles.wordmarkLink} aria-label={t('ezway, início')}>
        <ScrollReveal preset="image" className={styles.wordmarkFrame}>
          <BrandWordmark as="h2" registered className={styles.gradientWordmark} />
        </ScrollReveal>
      </a>
    </div>
  </section>;
}
