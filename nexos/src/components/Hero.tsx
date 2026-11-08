'use client';

import { forwardRef, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import ButtonWithIcon from './ui/button-witn-icon';
import GhostFibers from './GhostFibers';
import { TextType } from './ui/TextType';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { ScrollReveal } from './ScrollReveal';
import { useSectionScroll } from './SmoothScrollProvider';
import { HeroBrandStrip } from './HeroBrandStrip';
import { useLocale } from '@/lib/locale';
import { SITE_PALETTE } from '@/lib/brand-palette';

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
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, .975]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const opacity = useTransform(scrollYProgress, [0, .85, 1], [1, .55, .25]);

  return (
    <section ref={sectionRef} id="hero" tabIndex={-1} aria-labelledby="hero-title" data-home-experience="hero" data-managed-section-links data-nav-ready={navigationReady} className={cn('landing-hero oceanic-surface', className)}>
      {showHero && <div className="hero-fibers" aria-hidden="true"><GhostFibers glowColor={SITE_PALETTE.action} secondaryColor={SITE_PALETTE.highlight} lineColor={SITE_PALETTE.ink} layers={2} threads={48} density={0.7} particles={0.22} sparkle={0.35} glow={0.7} brightness={1.1} speed={0.24} flow={0.18} dpr={1.25} mouseInteraction pulseOnClick intro={false} paused={reduce} /></div>}
      <motion.div className="hero-container" data-hero-scroll style={reduce ? undefined : { scale, y, opacity }}>
        <motion.div className="hero-copy" initial={false} animate={showHero ? 'show' : 'hidden'}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : .6 } } }}>
           <ScrollReveal as="p" preset="label" className="hero-eyebrow"><span aria-hidden="true" /> {t('Placa Inteligente NFC + QR Code')}</ScrollReveal>
             <h1 id="hero-title" className="hero-heading" aria-label={`${heroSentence[locale][0]} ${heroWords[locale][0]} ${heroSentence[locale][1]}`}>
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][0]}</span>
               <TextType key={locale} text={heroWords[locale]} />
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][1]}</span>
             </h1>
            <ScrollReveal as="p" delay={.12} className="hero-description">{t('Na mesa, no balcão ou na recepção, seu cliente aproxima o celular da placa ou escaneia o QR Code e abre seu cardápio, site ou contato.')}</ScrollReveal>
           <ScrollReveal className="hero-actions" delay={.2}>
              <ButtonWithIcon href="#showcase" onClick={event => { event.preventDefault(); scrollToSection('#showcase'); }}>{t('Conhecer a Placa NFC')}</ButtonWithIcon>
           </ScrollReveal>
        </motion.div>
      </motion.div>
      <HeroBrandStrip active={showHero} />
    </section>
  );
});

export default Hero;
