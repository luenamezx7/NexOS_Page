'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import ButtonWithIcon from './ui/button-witn-icon';
import { HeroPlates } from './HeroPlates';
import { TextType } from './ui/TextType';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { ScrollReveal } from './ScrollReveal';
import { useSectionScroll } from './SmoothScrollProvider';
import { useLocale } from '@/lib/locale';

const subscribeHydration = () => () => {};
const heroWords = {
  pt: ['conectado', 'impulsionado', 'otimizado'],
  en: ['connected', 'powered', 'optimized'],
  es: ['conectado', 'impulsado', 'optimizado'],
} as const;
const heroSentence = { pt: ['Seu negócio', 'em uma aproximação'], en: ['Your business', 'with a single tap'], es: ['Tu negocio', 'con un solo toque'] } as const;

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const reduce = useReducedMotion();
  const { t, locale } = useLocale();
  const scrollToSection = useSectionScroll();
  const navigationReady = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();
  const showHero = !entryOpen || revealing;
  const sectionRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => sectionRef.current!);
  useEffect(() => {
    const hero = sectionRef.current;
    if (!hero) return;
    // Safari toolbar expansion changes the visible height during a touch gesture.
    // Keep the hero/quiz boundary at its initial small-viewport position; only
    // recalculate when the viewport width (or orientation) actually changes.
    let width = window.innerWidth;
    const measure = () => {
      hero.style.removeProperty('--hero-stable-height');
      hero.style.setProperty('--hero-stable-height', getComputedStyle(hero).minHeight);
    };
    if (width < 768) measure();
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      if (width < 768) measure();
      else hero.style.removeProperty('--hero-stable-height');
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); hero.style.removeProperty('--hero-stable-height'); };
  }, []);

  return (
    <section ref={sectionRef} id="hero" tabIndex={-1} aria-labelledby="hero-title" data-home-experience="hero" data-managed-section-links data-nav-ready={navigationReady} className={cn('landing-hero oceanic-surface', className)}>
      <motion.div className="hero-container" data-hero-scroll>
        <motion.div className="hero-copy" initial={false} animate={showHero ? 'show' : 'hidden'}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : .6 } } }}>
           <ScrollReveal as="p" preset="label" className="hero-eyebrow"><span aria-hidden="true" /> {t('Placa Inteligente NFC + QR Code')}</ScrollReveal>
             <h1 id="hero-title" className="hero-heading" aria-label={`${heroSentence[locale][0]} ${heroWords[locale][0]} ${heroSentence[locale][1]}`}>
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][0]}</span>
               <TextType key={locale} text={heroWords[locale]} />
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][1]}</span>
             </h1>
             <ScrollReveal as="p" delay={.12} className="hero-description">{t('Seu cliente se interessou. Facilite o próximo passo: com a placa ezway, ele aproxima um celular compatível com NFC ou lê o QR Code e abre o destino que você escolher.')}</ScrollReveal>
           <ScrollReveal className="hero-actions" delay={.2}>
              <ButtonWithIcon href="#showcase" onClick={event => { event.preventDefault(); scrollToSection('#showcase'); }}>{t('Conhecer a Placa NFC')}</ButtonWithIcon>
           </ScrollReveal>
        </motion.div>
        <HeroPlates />
      </motion.div>
    </section>
  );
});

export default Hero;
