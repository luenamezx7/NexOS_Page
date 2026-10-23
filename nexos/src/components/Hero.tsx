'use client';

import { forwardRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { HoverLink } from './ui/hover-button';
import { BrandVeil } from './ui/brand-veil';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const reduce = useReducedMotion();
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();
  const showHero = !entryOpen || revealing;

  return (
    <section ref={ref} id="hero" tabIndex={-1} aria-labelledby="hero-title" className={cn('landing-hero oceanic-surface', className)}>
      <BrandVeil />
      <div className="hero-container">
        <motion.div className="hero-copy" initial={reduce ? false : 'hidden'} animate={showHero ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } } }}>
          <p className="hero-eyebrow"><span aria-hidden="true" /> NEXOS LAB / DESIGN + CÓDIGO</p>
          <motion.h1 id="hero-title" className="hero-heading" variants={{ hidden: reduce ? {} : { opacity: 0, y: 38 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>Sites para<br /><span className="hero-accent">seu negócio.</span></motion.h1>
          <motion.p className="hero-description" variants={{ hidden: reduce ? {} : { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>A {config.brand.fullName} cria sites, landing pages e cardápios digitais. Conecte seu atendimento presencial com placas NFC e QR Code.</motion.p>
          <motion.div className="hero-actions" variants={{ hidden: reduce ? {} : { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.65 } } }}>
            <HoverLink href={config.hero.ctaPrimary.href}>{config.hero.ctaPrimary.label}</HoverLink>
            <a href="#showcase" className="hero-secondary">Conhecer a placa <ArrowUpRight size={17} aria-hidden="true" /></a>
          </motion.div>
        </motion.div>
        <div className="hero-bottom">
          <span>ESTÚDIO DIGITAL · PRODUTOS CONECTADOS</span>
          <a href="#fisico-digital">Explore a NexOS <ArrowDown size={16} aria-hidden="true" /></a>
          <span aria-hidden="true">[ SCROLL TO EXPLORE ]</span>
        </div>
      </div>
    </section>
  );
});

export default Hero;
