import { ScrollFloat, ScrollReveal } from '../ScrollReveal';
import { BrandWordmark } from '../BrandWordmark';
import styles from './BrandClosing.module.css';

/** A typographic closing scene, inspired by -/ref-name.png in the ezway palette. */
export function BrandClosing() {
  return <section id="brand-closing" className={styles.closing} aria-label="ezway — Design, código e conexão">
    <div className={styles.closingLight} aria-hidden="true" />
    <ScrollReveal preset="image" className={styles.wordmarkFrame}>
      <ScrollFloat distance={18}><BrandWordmark as="h2" /></ScrollFloat>
    </ScrollReveal>
    <ScrollReveal as="p" preset="label" className={styles.closingCaption}>Feito pela ezway</ScrollReveal>
  </section>;
}
