'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { raithonRealm } from '@/lib/brand-font';
import albinoTiger from '../../design-/img-ref/tigre_albino_capuz_fino.svg';
import { useSectionScroll } from './SmoothScrollProvider';
import styles from './AboutUs.module.css';
import { ScrollFloat, ScrollReveal } from './ScrollReveal';

/** Keep the existing anchor so bookmarks and shared section links still work. */
export function AboutUs() {
  const scrollToSection = useSectionScroll();

  return (
    <section id="testimonials" aria-labelledby="about-title" className={`${styles.section} ${raithonRealm.variable}`}>
      <div className={styles.container}>
        <ScrollReveal preset="label" className={styles.sectionNav}>
          <span>Sobre Nós</span>
          <a href="#faq" onClick={event => { if (scrollToSection('#faq')) event.preventDefault(); }}>
            Dúvidas frequentes <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </ScrollReveal>

        <div className={styles.layout}>
          <div className={styles.identity}>
            <ScrollReveal><span role="img" aria-label="Logo NexOS" className={styles.wordmark}>nexos</span>
            <p className={styles.companyName}>NexOS Lab</p>
            <p className={styles.signature}>Design, desenvolvimento<br />e conexões com propósito.</p></ScrollReveal>
            <ScrollReveal preset="image"><ScrollFloat><div className={styles.brandVisual}>
              <Image src={albinoTiger} alt="Mascote tigre albino da NexOS com óculos roxos" width={380} height={380}
                sizes="(max-width: 767px) 280px, 380px" className={styles.mascot} />
            </div></ScrollFloat></ScrollReveal>
          </div>

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
        </div>
      </div>
    </section>
  );
}
