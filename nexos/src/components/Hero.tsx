'use client';

import { forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { HoverLink } from './ui/hover-button';
import { useTheme } from './ThemeProvider';
import GradualBlur from './ui/GradualBlur';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { HERO_PALETTES } from '@/lib/brand-palette';

const GradientASCII = dynamic(() => import('./ui/GradientASCII'), { ssr: false });

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const { theme } = useTheme();
  const reduce = useReducedMotion();
  const entryOpen = usePresentationActive();

  return (
    <section ref={ref} id="hero" tabIndex={-1} aria-labelledby="hero-title" className={`landing-hero ${className}`}>
      <div className="hero-ascii" aria-hidden="true">
        {!entryOpen && <GradientASCII colors={HERO_PALETTES[theme]} lightMode={theme === 'light'}
          shape="horizon" characters=" =+xX0S8#@" cellSize={18} density={0.88}
          gradientOpacity={0.5} glyphOpacity={1} glow={theme === 'dark' ? 1.1 : 0.4} grain={0.025}
          flicker={0.16} speed={0.65} flow={0.55} dpr={1} maxFPS={30} visibilityMargin="-96px 0px 0px" />}
        <div className="hero-readability" />
        {!entryOpen && <GradualBlur position="top" height="16rem" strength={2.2} layers={32} curve="ease-in-out" saturation={1.5} tint="var(--color-canvas)" />}
        {!entryOpen && <GradualBlur position="bottom" height="16rem" strength={2.2} layers={32} curve="ease-in-out" saturation={1.5} tint="var(--color-canvas)" />}
        {!entryOpen && <div className="hero-bloom" aria-hidden="true" />}
        {!entryOpen && <div className="hero-glow" aria-hidden="true" />}
      </div>
      <div className="hero-container">
        <motion.div className="hero-copy" initial={reduce ? false : 'hidden'} animate={entryOpen ? 'hidden' : 'show'}
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
