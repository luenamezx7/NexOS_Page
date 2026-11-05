'use client';

import { forwardRef, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import { ArrowUpRight } from 'lucide-react';
import ButtonWithIcon from './ui/button-witn-icon';
import GhostFibers from './GhostFibers';
import { BlurReveal } from './blur-reveal';
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
const heroAccentWords = {
  pt: ['conectado.', 'aproximação.'],
  en: ['connected.', 'tap.'],
  es: ['conectado.', 'acercamiento.'],
} as const;

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
            <BlurReveal as="h1" id="hero-title" key={`${showHero}-${locale}`} className="hero-heading" speedReveal={3} speedSegment={.8} accentWords={heroAccentWords[locale]}>{t('Seu negócio conectado. A uma aproximação.')}</BlurReveal>
           <ScrollReveal as="p" delay={.12} className="hero-description">{t('Placas NFC e QR Code que levam seu cliente ao seu cardápio, site ou canal de contato. E soluções digitais para apresentar tudo o que sua marca oferece.')}</ScrollReveal>
           <ScrollReveal className="hero-actions" delay={.2}>
              <ButtonWithIcon href="#showcase" onClick={event => { event.preventDefault(); scrollToSection('#showcase'); }}>{t('Conhecer a Placa NFC')}</ButtonWithIcon>
             <a href="#contact" onClick={event => { event.preventDefault(); scrollToSection('#contact'); }} className="hero-text-link">{t('Conversar sobre meu negócio')} <ArrowUpRight size={17} aria-hidden="true" /></a>
           </ScrollReveal>
        </motion.div>
      </motion.div>
      <HeroBrandStrip active={showHero} />
    </section>
  );
});

export default Hero;
