'use client';

import { forwardRef, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { HoverLink } from './ui/hover-button';
import { BackgroundPaths } from './ui/background-paths';
import { BrandVeil } from './ui/brand-veil';
import { BlurReveal } from './blur-reveal';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { ScrollReveal } from './ScrollReveal';
import { useSectionScroll } from './SmoothScrollProvider';
import { HeroBrandStrip } from './HeroBrandStrip';

const subscribeHydration = () => () => {};

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const reduce = useReducedMotion();
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
      <div className="hero-gradient-blend" aria-hidden="true"><BrandVeil variant="hero" /></div>
      <div className="hero-atmosphere" aria-hidden="true" />
      <BackgroundPaths active={showHero} />
      <motion.div className="hero-container" data-hero-scroll style={reduce ? undefined : { scale, y, opacity }}>
        <motion.div className="hero-copy" initial={false} animate={showHero ? 'show' : 'hidden'}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : .6 } } }}>
          <ScrollReveal as="p" preset="label" className="hero-eyebrow"><span aria-hidden="true" /> Sites e soluções digitais</ScrollReveal>
          <BlurReveal as="h1" id="hero-title" key={String(showHero)} className="hero-heading" speedReveal={3} speedSegment={.8}>Soluções com IA que impulsionam seu negócio</BlurReveal>
          <ScrollReveal as="p" delay={.12} className="hero-description">Sites, landing pages e cardápios com identidade. Experiências NFC e QR Code que conectam sua marca ao mundo real.</ScrollReveal>
          <ScrollReveal className="hero-actions" delay={.2}>
            <HoverLink href="#services" onClick={event => { event.preventDefault(); scrollToSection('#services'); }}>Explorar soluções</HoverLink>
            <a href="#showcase" onClick={event => { event.preventDefault(); scrollToSection('#showcase'); }} className="hero-text-link">Conhecer a Placa NFC <ArrowUpRight size={17} aria-hidden="true" /></a>
          </ScrollReveal>
        </motion.div>
        <div className="hero-bottom">
          <a href="#fisico-digital" onClick={event => { event.preventDefault(); scrollToSection('#fisico-digital'); }}>Explore a NexOS <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </motion.div>
      <HeroBrandStrip active={showHero} />
    </section>
  );
});

export default Hero;
