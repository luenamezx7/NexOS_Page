'use client';

import Image from 'next/image';
import styles from './AboutUs.module.css';
import { ScrollReveal } from './ScrollReveal';
import { EasyWayIntegrations } from './EasyWayIntegrations';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

/** Keep the existing anchor so bookmarks and shared section links still work. */
export function AboutUs() {
  const { t } = useLocale();
  return (
    <section id="testimonials" aria-labelledby="about-title" className={styles.section}>
      <div className={styles.container}>
        <ScrollReveal preset="label" className={styles.sectionNav}>
          <span>{t('Sobre nós')}</span>
        </ScrollReveal>

        <div className={styles.layout}>
          <div className={styles.story}>
            <ScrollReveal as="h2" preset="title" id="about-title" className={styles.heading}>
              {t('Mais pontos de contato.')}<br /><span>{t('Menos caminhos perdidos.')}</span>
            </ScrollReveal>
            <ScrollReveal as="p" delay={.08} className={styles.lead}>
              {t('A ezway ajuda pequenos negócios a transformar interesse em contato. Criamos os caminhos entre quem procura e quem vende.')}
            </ScrollReveal>
            <div className={styles.body}>
              <ScrollReveal as="p">
                {t('Fazemos placas NFC, cardápios, sites e páginas para que o cliente encontre informações e saiba como falar com você.')}
              </ScrollReveal>
              <ScrollReveal as="p">
                {t('Na mesa, no balcão ou na internet, conectamos diferentes pontos da jornada: descoberta, atendimento e venda.')}
              </ScrollReveal>
            </div>

            <div className={styles.principles}>
              <ScrollReveal>
                 <h3>{t('Sem complicar.')}</h3>
                 <p>{t('Você conta o problema. A gente define com você o que faz sentido criar.')}</p>
              </ScrollReveal>
              <ScrollReveal delay={.08}>
                 <h3>{t('Do primeiro toque ao contato.')}</h3>
                 <p>{t('A placa leva ao destino certo. O digital mostra o que você oferece.')}</p>
              </ScrollReveal>
            </div>

          </div>
          <div className={styles.identity}>
            <ScrollReveal preset="image"><EasyWayIntegrations /></ScrollReveal>
          </div>
        </div>
        {landingEvidence.founder && <div className={styles.founders}><h3>{t('Quem está por trás da ezway')}</h3><div className={styles.founderCard}><Image className={styles.founderPhoto} src={landingEvidence.founder.photo} alt={`${t('Foto de')} ${landingEvidence.founder.name}`} width={112} height={112} /><div><strong>{landingEvidence.founder.name}</strong><p>{t(landingEvidence.founder.role)}</p></div></div></div>}
      </div>
    </section>
  );
}
