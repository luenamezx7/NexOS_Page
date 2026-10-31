'use client';

import { ArrowUpRight } from 'lucide-react';
import { raithonRealm } from '@/lib/brand-font';
import { useSectionScroll } from './SmoothScrollProvider';
import styles from './AboutUs.module.css';
import { ScrollReveal } from './ScrollReveal';
import { GlyphMatrix } from './ui/glyph-matrix';
import { NexosIntegrations } from './NexosIntegrations';
import { useTheme } from './ThemeProvider';
import { VISOR_PALETTE } from '@/lib/brand-palette';

/** Keep the existing anchor so bookmarks and shared section links still work. */
export function AboutUs() {
  const scrollToSection = useSectionScroll();
  const { theme } = useTheme();

  return (
    <section id="testimonials" aria-labelledby="about-title" className={`${styles.section} ${raithonRealm.variable}`}>
      <div className={styles.matrix} aria-hidden="true"><GlyphMatrix cellSize={22} mutationRate={.025} interval={140} fadeBottom={.8} color={theme === 'dark' ? VISOR_PALETTE.lilac : VISOR_PALETTE.violet} /></div>
      <div className={styles.container}>
        <ScrollReveal preset="label" className={styles.sectionNav}>
          <span>Sobre Nós</span>
          <a href="#faq" onClick={event => { if (scrollToSection('#faq')) event.preventDefault(); }}>
            Dúvidas frequentes <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </ScrollReveal>

        <div className={styles.layout}>
          <div className={styles.story}>
            <ScrollReveal as="h2" preset="title" id="about-title" className={styles.heading}>
              Design e tecnologia.<br /><span>Negócios mais próximos.</span>
            </ScrollReveal>
            <ScrollReveal as="p" delay={.08} className={styles.lead}>
              Somos a NexOS Lab. Unimos design, desenvolvimento e estratégia para criar experiências digitais que fazem sentido para o seu negócio.
            </ScrollReveal>
            <div className={styles.body}>
              <ScrollReveal as="p">
                Criamos sites, landing pages e cardápios digitais com identidade própria, navegação clara e atenção ao desempenho. Tudo começa por entender sua marca, seu público e o que você quer comunicar.
              </ScrollReveal>
              <ScrollReveal as="p">
                Com nossas placas NFC e QR Code, conectamos essa presença ao atendimento presencial. Um gesto leva seu cliente ao seu cardápio, portfólio ou canal de contato.
              </ScrollReveal>
            </div>

            <div className={styles.principles}>
              <ScrollReveal>
                <h3>Clareza em cada etapa.</h3>
                <p>Escopo alinhado e comunicação direta. Você acompanha o caminho da ideia à entrega.</p>
              </ScrollReveal>
              <ScrollReveal delay={.08}>
                <h3>Sua marca, de ponta a ponta.</h3>
                <p>Do visual à interação, cada escolha ajuda a tornar sua presença mais coerente e fácil de usar.</p>
              </ScrollReveal>
            </div>

            <a href="#services" className={styles.servicesLink} onClick={event => { if (scrollToSection('#services')) event.preventDefault(); }}>
              Ver soluções <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.identity}>
            <ScrollReveal preset="image"><NexosIntegrations /></ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
