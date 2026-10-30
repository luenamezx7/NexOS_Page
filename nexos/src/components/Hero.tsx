'use client';

import { forwardRef, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { HoverLink } from './ui/hover-button';
import { BrandVeil } from './ui/brand-veil';
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
    <section ref={sectionRef} id="hero" tabIndex={-1} aria-labelledby="hero-title" data-managed-section-links data-nav-ready={navigationReady} className={cn('landing-hero oceanic-surface', className)}>
      <BrandVeil variant="hero" />
      <motion.div className="hero-container" data-hero-scroll style={reduce ? undefined : { scale, y, opacity }}>
        <motion.div className="hero-copy" initial={false} animate={showHero ? 'show' : 'hidden'}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: reduce ? 0 : .6 } } }}>
          <ScrollReveal as="p" preset="label" className="hero-eyebrow"><span aria-hidden="true" /> NEXOS LAB / DESIGN + CÓDIGO</ScrollReveal>
          <ScrollReveal as="h1" preset="title" delay={.06} id="hero-title" className="hero-heading">Soluções com <span className="hero-accent hero-ia">IA</span> que impulsionam{' '}<span className="hero-accent">seu negócio</span></ScrollReveal>
          <ScrollReveal as="p" delay={.12} className="hero-description">A Nexos LAB cria páginas diversas, otimiza sua operação, e aproxima seus clientes com a Placa Inteligente NFC, conectando o físico ao digital.</ScrollReveal>
          <ScrollReveal className="hero-actions" delay={.2}>
            <HoverLink href={config.hero.ctaPrimary.href} target="_blank" rel="noopener noreferrer">{config.hero.ctaPrimary.label}</HoverLink>
            <a href="#showcase" onClick={event => { event.preventDefault(); scrollToSection('#showcase'); }} className="hero-text-link">Conhecer a placa <ArrowUpRight size={17} aria-hidden="true" /></a>
          </ScrollReveal>
        </motion.div>
        <div className="hero-bottom">
          <span>ESTÚDIO DIGITAL · PRODUTOS CONECTADOS</span>
          <a href="#fisico-digital" onClick={event => { event.preventDefault(); scrollToSection('#fisico-digital'); }}>Explore a NexOS <ArrowDown size={16} aria-hidden="true" /></a>
          <span aria-hidden="true">[ SCROLL TO EXPLORE ]</span>
        </div>
      </motion.div>
      <HeroBrandStrip active={showHero} />
    </section>
  );
});

export default Hero;
