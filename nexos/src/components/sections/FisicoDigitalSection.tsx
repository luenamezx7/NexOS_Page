'use client';

import { ArrowUpRight, Braces, Fingerprint, Layers, Nfc, ScanLine } from 'lucide-react';
import styles from './Sections.module.css';
import { ScrollFloat, ScrollReveal } from '../ScrollReveal';

const FEATURES = [
  { icon: Layers, label: 'Design', title: 'Uma identidade. Em cada detalhe.', body: 'Sua marca orienta a experiência, da primeira tela ao ponto de contato físico.' },
  { icon: Braces, label: 'Desenvolvimento', title: 'Ideia boa precisa funcionar.', body: 'Sites, cardápios e landing pages construídos em torno do que seu negócio precisa.' },
  { icon: Nfc, label: 'NFC e QR Code', title: 'Do presencial para o digital.', body: 'NFC e QR Code levam o cliente do balcão ao seu próximo contato.' },
];

export function FisicoDigitalSection() {
  return <section id="fisico-digital" aria-labelledby="fisico-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.brandGrid}>
        <header>
          <ScrollReveal as="h2" preset="title" id="fisico-title" className={styles.heading}>Tecnologia com<br /><span>ponto de contato.</span></ScrollReveal>
          <ScrollReveal as="p" delay={.06} className={styles.lead}>Design, desenvolvimento e produtos conectados. Partes diferentes da mesma experiência: a do seu cliente.</ScrollReveal>
          <ScrollReveal delay={.12}><a href="#showcase" className={styles.textLink}>Explore essa conexão <ArrowUpRight size={18} aria-hidden="true" /></a></ScrollReveal>
        </header>
        <ScrollReveal preset="card" delay={.12}><ScrollFloat className={styles.connection}>
          <div className={styles.connectionAura} aria-hidden="true" />
          <span className={styles.connectionLabel}>Do físico ao digital</span>
          <div className={styles.connectionNodes} aria-hidden="true"><Fingerprint /><i /><Nfc /><i /><ScanLine /></div>
          <div className={styles.connectionLabels}><span>Sua marca</span><span>Um gesto</span><span>Seu digital</span></div>
          <span className={styles.connectionStatus}><i aria-hidden="true" /> Aproxime ou escaneie</span>
        </ScrollFloat></ScrollReveal>
      </div>
      <div className={styles.featureGrid}>{FEATURES.map(({ icon: Icon, label, title, body }, index) => <ScrollReveal as="article" key={label} delay={index * .08}>
        <div className={styles.featureTop}><span>{label}</span><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></div>
        <h3>{title}</h3><p>{body}</p>
      </ScrollReveal>)}</div>
    </div>
  </section>;
}
