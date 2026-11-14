'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { config } from '@/config';
import toqueEzway from '../../../public/media/toque-ezway.jpg';
import styles from './Sections.module.css';
import { ScrollReveal } from '../ScrollReveal';
import { useLocale } from '@/lib/locale';

export function CTAFinal() {
  const { t } = useLocale();
  const whatsapp = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(t(config.whatsapp.message))}`;

  return <section id="cta-final" aria-labelledby="cta-title" className={`${styles.section} ${styles.brandCta}`}>
    <span id="manifesto" className={styles.ctaAnchor} aria-hidden="true" />
    <span id="contact" className={styles.ctaAnchor} aria-hidden="true" />
    <div className={`${styles.container} ${styles.finalCta}`}>
      <div className={styles.ctaLayout}>
           <h2 id="cta-title">{t('Vamos conectar seu negócio?')}</h2>
      </div>
      <div className={styles.ctaVisual} data-cta-visual>
        <div className={styles.ctaImageMotion}>
          <Image src={toqueEzway} alt={t('Duas mãos se aproximando com a marca ezway ao centro')} fill sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1280px) 45vw, 540px" quality={90} className={styles.ctaBrandImage} loading="lazy" />
        </div>
      </div>
        <div className={styles.ctaBottom}><ScrollReveal as="p">{t('Conte o que seu cliente precisa encontrar. Vamos definir juntos a placa e o destino digital.')}</ScrollReveal><ScrollReveal className={styles.ctaActions} delay={.1}>
         <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t('Conversar com a ezway no WhatsApp')} <ArrowUpRight size={16} aria-hidden="true" /></a>
      </ScrollReveal></div>
    </div>
  </section>;
}
