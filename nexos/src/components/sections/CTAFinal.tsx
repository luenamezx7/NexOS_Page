'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { config } from '@/config';
import tigerPortrait from '../../../design-/VIDEOS-IA/tiger-pic-2k-purp.jpg';
import styles from './Sections.module.css';
import { ScrollReveal } from '../ScrollReveal';
import { BlurReveal } from '../blur-reveal';
import { useLocale } from '@/lib/locale';

export function CTAFinal() {
  const { t } = useLocale();
  const whatsapp = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`;
  return <section id="cta-final" aria-labelledby="cta-title" className={`${styles.section} ${styles.tigerCta}`}>
    <span id="manifesto" className={styles.ctaAnchor} aria-hidden="true" />
    <Image src={tigerPortrait} alt="" fill sizes="100vw" className={styles.tigerImage} loading="lazy" />
    <div className={`${styles.container} ${styles.finalCta}`}>
      <div className={styles.ctaLayout}>
         <BlurReveal as="h2" id="cta-title" inView speedReveal={3}>{t('Sua próxima ideia. Vamos colocar no ar?')}</BlurReveal>
        <ArrowDownRight className={styles.ctaArrow} strokeWidth={1} aria-hidden="true" />
      </div>
      <div className={styles.ctaBottom}><ScrollReveal as="p">Um projeto digital, uma placa conectada ou uma ideia que ainda está tomando forma.</ScrollReveal><ScrollReveal className={styles.ctaActions} delay={.1}>
        <a href="#contact" className="btn-primary-nex">Agendar conversa <ArrowUpRight size={18} aria-hidden="true" /></a>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Conversar com a ezway no WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a>
        <a href="mailto:nexosperformance@gmail.com" className={styles.textLink}>Prefiro conversar por e-mail <ArrowUpRight size={16} aria-hidden="true" /></a>
      </ScrollReveal></div>
    </div>
  </section>;
}
