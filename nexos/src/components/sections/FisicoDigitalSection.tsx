'use client';

import { ArrowUpRight, Braces, Fingerprint, Layers, Nfc, ScanLine } from 'lucide-react';
import styles from './Sections.module.css';

const FEATURES = [
  { icon: Layers, label: '01 / DESIGN', title: 'Uma identidade. Em cada detalhe.', body: 'Sua marca orienta a experiência, da primeira tela ao ponto de contato físico.' },
  { icon: Braces, label: '02 / CÓDIGO', title: 'Ideia boa precisa funcionar.', body: 'Sites, cardápios e landing pages construídos em torno do que seu negócio precisa.' },
  { icon: Nfc, label: '03 / CONEXÃO', title: 'Do presencial para o digital.', body: 'NFC e QR Code levam o cliente do balcão ao seu próximo contato.' },
];

export function FisicoDigitalSection() {
  return <section id="fisico-digital" aria-labelledby="fisico-title" className={styles.section}>
    <div className={styles.container}>
      <div className={`${styles.eyebrow} topography-glass topography-glass--compact`}><span>01 / O ESTÚDIO</span><span>FÍSICO ↔ DIGITAL</span></div>
      <div className={styles.brandGrid}>
        <header className="topography-glass topography-glass--copy">
          <p className={styles.kicker}>Do primeiro pixel ao mundo real.</p>
          <h2 id="fisico-title" className={styles.heading}>Tecnologia com<br /><span>ponto de contato.</span></h2>
          <p className={styles.lead}>Design, desenvolvimento e produtos conectados. Partes diferentes da mesma experiência: a do seu cliente.</p>
          <a href="#showcase" className={styles.textLink}>Explore essa conexão <ArrowUpRight size={18} aria-hidden="true" /></a>
        </header>
        <div className={`${styles.connection} topography-glass`} aria-label="NFC e QR Code conectam sua marca ao digital">
          <span className={styles.connectionLabel}>NEXOS / CONNECTION SYSTEM</span>
          <div className={styles.connectionNodes} aria-hidden="true"><Fingerprint /><i /><Nfc /><i /><ScanLine /></div>
          <div className={styles.connectionLabels}><span>Sua marca</span><span>Um gesto</span><span>Seu digital</span></div>
          <span className={styles.connectionStatus}><i /> FÍSICO + DIGITAL / CONECTADOS</span>
        </div>
      </div>
      <div className={`${styles.featureGrid} topography-glass topography-glass--copy`}>{FEATURES.map(({ icon: Icon, label, title, body }) => <article key={label}>
        <div className={styles.featureTop}><span>{label}</span><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></div>
        <h3>{title}</h3><p>{body}</p>
      </article>)}</div>
    </div>
  </section>;
}
