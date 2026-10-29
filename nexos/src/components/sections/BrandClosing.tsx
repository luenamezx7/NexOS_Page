import { raithonRealm } from '@/lib/brand-font';
import { ScrollFloat, ScrollReveal } from '../ScrollReveal';
import styles from './BrandClosing.module.css';

/** A typographic closing scene, inspired by -/ref-name.png in the NexOS palette. */
export function BrandClosing() {
  return <section id="brand-closing" className={`${styles.closing} ${raithonRealm.variable}`} aria-label="NexOS — Design, código e conexão">
    <div className={styles.closingLight} aria-hidden="true" />
    <ScrollReveal preset="image" className={styles.wordmarkFrame}>
      <ScrollFloat distance={18}><h2 className={styles.wordmark}>NEXOS</h2></ScrollFloat>
    </ScrollReveal>
    <ScrollReveal as="p" preset="label" className={styles.closingCaption}>DESIGN. CÓDIGO. CONEXÃO.</ScrollReveal>
  </section>;
}
