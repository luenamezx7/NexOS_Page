'use client';

import { easyway } from '@/config/easyway';
import { BlurReveal } from '../blur-reveal';
import { ScrollReveal } from '../ScrollReveal';
import { Iphone } from '../ui/iphone';
import styles from './EasyWay.module.css';

export function EasyWay() {
  return <section id="easyway" aria-labelledby="easyway-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.top}><span>Em desenvolvimento</span><span className={styles.status}><i aria-hidden="true" />{easyway.status}</span></div>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.name}>{easyway.name}<span>Nome provisório</span></p>
          <BlurReveal as="h2" id="easyway-title" className={styles.heading} inView speedReveal={3} speedSegment={.8}>{easyway.headline}</BlurReveal>
          <ScrollReveal as="p" className={styles.description}>{easyway.description}</ScrollReveal>
          <p className={styles.disclaimer}>{easyway.disclaimer}</p>
        </div>
        <ScrollReveal as="figure" preset="image" className={styles.mockup}>
          <Iphone className={styles.device} role="img" aria-label="Mockup iPhone da EasyWay com tela vazia" />
          <figcaption>Prévia do projeto</figcaption>
        </ScrollReveal>
      </div>
    </div>
  </section>;
}
