'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { config } from '@/config';
import animatedBrand from '../../../design-/rebrand-nexos/Glossy Black Flame Mascot1.png';
import styles from './Sections.module.css';
import { ScrollReveal } from '../ScrollReveal';
import { BlurReveal } from '../blur-reveal';
import { useLocale } from '@/lib/locale';

export function CTAFinal() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useLocale();
  const whatsapp = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`;
  useEffect(() => {
    const section = sectionRef.current;
    const visual = section?.querySelector<HTMLElement>('[data-cta-visual]');
    const image = section?.querySelector<HTMLElement>('[data-cta-parallax]');
     if (!section || !visual || !image || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
         if (matchMedia('(min-width: 768px)').matches) {
           gsap.fromTo(visual, { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
         } else {
           gsap.fromTo(image, { y: 16, opacity: .7 }, { y: 0, opacity: 1, duration: .7, ease: 'power2.out', immediateRender: false, scrollTrigger: { trigger: visual, start: 'top 92%', once: true } });
         }
      }, section);
      let leave = () => {};
      let move: (event: PointerEvent) => void = () => {};
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const x = gsap.quickTo(image, 'x', { duration: .7, ease: 'power2.out' });
        const y = gsap.quickTo(image, 'y', { duration: .7, ease: 'power2.out' });
        move = event => {
          const rect = visual.getBoundingClientRect();
          x(((event.clientX - rect.left) / rect.width - .5) * 24);
          y(((event.clientY - rect.top) / rect.height - .5) * 24);
        };
        leave = () => { x(0); y(0); };
        visual.addEventListener('pointermove', move, { passive: true });
        visual.addEventListener('pointerleave', leave);
      }
      cleanup = () => {
        visual.removeEventListener('pointermove', move);
        visual.removeEventListener('pointerleave', leave);
        gsap.killTweensOf(image);
        context.revert();
      };
    });
    return () => { disposed = true; cleanup(); };
  }, []);

  return <section ref={sectionRef} id="cta-final" aria-labelledby="cta-title" className={`${styles.section} ${styles.brandCta}`}>
    <span id="manifesto" className={styles.ctaAnchor} aria-hidden="true" />
    <div className={`${styles.container} ${styles.finalCta}`}>
      <div className={styles.ctaLayout}>
           <BlurReveal as="h2" id="cta-title" inView speedReveal={3}>{t('Vamos conectar seu negócio?')}</BlurReveal>
      </div>
      <div className={styles.ctaVisual} data-cta-visual>
        <div className={styles.ctaImageMotion} data-cta-parallax>
          <Image src={animatedBrand} alt={t('Mascote 3D da ezway, flutuando com olhos em forma de estrelas')} fill sizes="(max-width: 767px) 100vw, 45vw" className={styles.ctaBrandImage} loading="lazy" />
        </div>
      </div>
        <div className={styles.ctaBottom}><ScrollReveal as="p">{t('Conte o que seu cliente precisa encontrar. Vamos definir juntos a placa e o destino digital.')}</ScrollReveal><ScrollReveal className={styles.ctaActions} delay={.1}>
         <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t('Conversar com a ezway no WhatsApp')} <ArrowUpRight size={16} aria-hidden="true" /></a>
      </ScrollReveal></div>
    </div>
  </section>;
}
