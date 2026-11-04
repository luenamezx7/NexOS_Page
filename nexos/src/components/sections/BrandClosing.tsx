'use client';

import { ScrollFloat, ScrollReveal } from '../ScrollReveal';
import { BrandWordmark } from '../BrandWordmark';
import styles from './BrandClosing.module.css';
import { useLocale } from '@/lib/locale';

/** A typographic closing scene, inspired by -/ref-name.png in the ezway palette. */
export function BrandClosing() {
  const { t } = useLocale();
  return <section id="brand-closing" className={styles.closing} aria-label={t('ezway — Design, código e conexão')}>
    <div className={styles.closingLight} aria-hidden="true" />
    <ScrollReveal preset="image" className={styles.wordmarkFrame}>
      <ScrollFloat distance={18}><BrandWordmark as="h2" /></ScrollFloat>
    </ScrollReveal>
    <ScrollReveal as="p" preset="label" className={styles.closingCaption}>{t('Feito pela ezway')}</ScrollReveal>
  </section>;
}
