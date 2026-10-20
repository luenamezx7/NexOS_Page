'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { raithonRealm } from '@/lib/brand-font';
import purpleWolf from '../../design-/img-ref/mascote_lobo_roxo.svg';
import { useSectionScroll } from './SmoothScrollProvider';
import styles from './AboutUs.module.css';

/** Keep the existing anchor so bookmarks and shared section links still work. */
export function AboutUs() {
  const scrollToSection = useSectionScroll();

  return (
    <section id="testimonials" aria-labelledby="about-title" className={`${styles.section} ${raithonRealm.variable}`}>
      <div className={styles.container}>
        <div className={styles.sectionNav}>
          <span>Sobre Nós</span>
          <a href="#faq" onClick={event => { if (scrollToSection('#faq')) event.preventDefault(); }}>
            Dúvidas frequentes <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className={styles.layout}>
          <div className={styles.identity}>
            <span role="img" aria-label="Logo NexOS" className={styles.wordmark}>nexos</span>
            <p className={styles.companyName}>NexOS Lab</p>
            <p className={styles.signature}>Design, desenvolvimento<br />e conexões com propósito.</p>
            <div className={styles.brandVisual}>
              <Image src={purpleWolf} alt="Mascote da NexOS com óculos roxos" width={380} height={380}
                sizes="(max-width: 767px) 280px, 380px" className={styles.mascot} />
            </div>
          </div>

          <div className={styles.story}>
            <h2 id="about-title" className={styles.heading}>
              Design e tecnologia.<br /><span>Negócios mais próximos.</span>
            </h2>
            <p className={styles.lead}>
              Somos a NexOS Lab. Unimos design, desenvolvimento e estratégia para criar experiências digitais que fazem sentido para o seu negócio.
            </p>
            <div className={styles.body}>
              <p>
                Criamos sites, landing pages e cardápios digitais com identidade própria, navegação clara e atenção ao desempenho. Tudo começa por entender sua marca, seu público e o que você quer comunicar.
              </p>
              <p>
                Com nossas placas NFC e QR Code, conectamos essa presença ao atendimento presencial. Um gesto leva seu cliente ao seu cardápio, portfólio ou canal de contato.
              </p>
            </div>

            <div className={styles.principles}>
              <div>
                <h3>Clareza em cada etapa.</h3>
                <p>Escopo alinhado e comunicação direta. Você acompanha o caminho da ideia à entrega.</p>
              </div>
              <div>
                <h3>Sua marca, de ponta a ponta.</h3>
                <p>Do visual à interação, cada escolha ajuda a tornar sua presença mais coerente e fácil de usar.</p>
              </div>
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
