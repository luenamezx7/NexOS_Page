'use client';

import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, ArrowUpRight, Zap, Layers, Gauge } from 'lucide-react';
import DarkVeil from './DarkVeil';
import Grainient from './Grainient';
import { HoldButton } from './HoldButton';
import { useTheme } from './ThemeProvider';
import { config } from '@/config';

interface HeroProps {
  className?: string;
}

interface BentoCardData {
  id: string;
  badge: string;
  title: string;
  description: string;
  metricValue: string;
  metricLabel: string;
  ctaLabel: string;
  ctaHref: string;
  icon: ReactNode;
  span: string;
  featured?: boolean;
  featuredBadge?: string;
}

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ENTER = {
  initial: { opacity: 0, y: 30, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, ease: FLUID_EASE },
} as const;

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: FLUID_EASE },
  },
};

function navigate(href: string): void {
  if (href.startsWith('#')) {
    const el: HTMLElement | null = document.getElementById(href.replace('#', ''));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  window.location.href = href;
}

const BENTO_CARDS: BentoCardData[] = [
  {
    id: 'branding',
    badge: 'Branding Control',
    title: 'Controle total do seu branding',
    description:
      'Design system próprio, identidade corporativa e guias de uso escaláveis. Sua marca consistente em cada pixel, do logo ao produto.',
    metricValue: '100%',
    metricLabel: 'consistência de marca',
    ctaLabel: 'Ver Serviços',
    ctaHref: '#services',
    icon: <Layers size={18} strokeWidth={1.75} aria-hidden="true" />,
    span: 'md:col-span-7',
  },
  {
    id: 'performance-valor',
    badge: 'Performance & Valor',
    title: 'Performance que gera valor B2B',
    description:
      'Modelo B2B focado em impulsionar negócios: velocidade, conversão e entrega de valor agregado mensurável para sua operação.',
    metricValue: '+35%',
    metricLabel: 'valor agregado B2B',
    ctaLabel: 'Ver Serviços',
    ctaHref: '#services',
    icon: <Zap size={18} strokeWidth={1.75} aria-hidden="true" />,
    span: 'md:col-span-5',
    featured: true,
    featuredBadge: 'Destaque B2B',
  },
  {
    id: 'strategy',
    badge: 'Discovery',
    title: 'A melhor estratégia para seu Business',
    description:
      'A melhor estratégia para seu Business: validação de produto, roadmap técnico e plano de execução de 90 dias antes de investir em código.',
    metricValue: '6 sem',
    metricLabel: 'MVP médio',
    ctaLabel: 'Agendar Discovery',
    ctaHref: '#contact',
    icon: <Gauge size={18} strokeWidth={1.75} aria-hidden="true" />,
    span: 'md:col-span-5',
  },
  {
    id: 'mvp',
    badge: 'MVP Development',
    title: 'Do protótipo à validação',
    description:
      'Prototipagem rápida e MVPs para validar clientes: Landing Pages, Cardápios, Portfólios, Biolinks e Gateways prontos para vender.',
    metricValue: '4 sem',
    metricLabel: 'protótipo validado',
    ctaLabel: 'Ver Serviços',
    ctaHref: '#services',
    icon: <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />,
    span: 'md:col-span-7',
  },
];

interface BentoCardProps {
  card: BentoCardData;
  reduceMotion: boolean;
}

function BentoCard({ card, reduceMotion }: BentoCardProps) {
  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className={`bento-card will-change-transform group relative flex flex-col p-6 transition-colors duration-300 hover:border-ink/25 md:p-7 ${card.span} ${
        card.featured
          ? '!border-pink-500/50 shadow-[0_0_28px_rgba(255,46,106,0.22),0_18px_60px_-24px_rgba(255,46,106,0.45)]'
          : ''
      }`}
      aria-labelledby={`bento-title-${card.id}`}
    >
      {card.featured && card.featuredBadge && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border border-pink-500/50 bg-[#ff2e6a] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_16px_rgba(255,46,106,0.6)]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" aria-hidden="true" />
          {card.featuredBadge}
        </span>
      )}
      <div className="mb-5 flex flex-row items-center justify-between gap-3">
        <span className={`tech-badge ${card.featured ? '!border-pink-500/50 !text-ink' : ''}`}>
          <span className="tech-badge-dot" aria-hidden="true" />
          {card.badge}
        </span>
        <span
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 bg-ink/[0.04] text-ink/70 transition-colors duration-300 group-hover:border-pink-500/40 group-hover:text-ink"
          aria-hidden="true"
        >
          {card.icon}
        </span>
      </div>

      <h3 id={`bento-title-${card.id}`} className="mb-2 text-xl font-bold tracking-tight text-ink">
        {card.title}
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-ink/70">{card.description}</p>

      <div className="mb-6 flex flex-row items-baseline gap-2">
        <span className="font-display text-3xl font-bold tracking-tight text-ink">{card.metricValue}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">{card.metricLabel}</span>
      </div>

      <div className="mt-auto flex flex-row items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="button"
          onClick={() => navigate(card.ctaHref)}
          aria-label={card.ctaLabel}
          className="btn-secondary-nex w-full !justify-between"
        >
          <span>{card.ctaLabel}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}

const HeroComponent = forwardRef<HTMLElement, HeroProps>(
  ({ className = '' }: HeroProps, ref: ForwardedRef<HTMLElement>) => {
    const reduce = useReducedMotion() ?? false;
    const { theme } = useTheme();

    return (
      <section
        ref={ref}
        id="hero"
        aria-labelledby="hero-title"
        className={`relative overflow-hidden bg-canvas ${className}`}
      >
        {theme === 'dark' ? (
          <div className="veil-wrap" aria-hidden="true">
            <DarkVeil
              hueShift={275}
              noiseIntensity={0.08}
              speed={0.5}
              scanlineFrequency={0.3}
              warpAmount={3}
            />
          </div>
        ) : (
          <div className="veil-wrap" aria-hidden="true">
            <Grainient
              color1="#ffd6e7"
              color2="#ff2e6a"
              color3="#ece7db"
              lightMode={true}
              timeSpeed={0.25}
              warpStrength={1.0}
              warpFrequency={5.0}
              warpSpeed={2.0}
              warpAmplitude={50.0}
              grainAmount={0.06}
              grainScale={2.0}
              grainAnimated={false}
              contrast={1.2}
              gamma={1.0}
              saturation={0.9}
              zoom={0.9}
            />
          </div>
        )}
        <div className="grid-pattern-subtle" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-canvas"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pb-32 md:pt-32">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={ENTER.transition}
              className="mb-6 will-change-transform"
            >
              <span className="tech-badge">
                <span className="tech-badge-dot animate-pulse-dot" aria-hidden="true" />
                Starter Kit para MVPs em 4 semanas
              </span>
            </motion.div>

            <motion.h1
              id="hero-title"
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ ...ENTER.transition, delay: 0.08 }}
              className="w-full max-w-5xl text-balance font-heavy text-5xl font-black leading-[1.02] tracking-[-0.02em] text-ink will-change-transform md:text-6xl lg:text-7xl"
            >
              {config.hero.headline}
            </motion.h1>

            <motion.p
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...ENTER.transition, delay: 0.16 }}
              className="mt-5 max-w-[62ch] text-base leading-relaxed text-ink/70 will-change-transform md:text-lg"
            >
              {config.hero.subheadline}
            </motion.p>

            <motion.div
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...ENTER.transition, delay: 0.24 }}
              className="mt-8 flex w-full flex-col items-center justify-center gap-3 will-change-transform sm:flex-row"
            >
              <HoldButton
                label={config.hero.ctaPrimary.label}
                ariaLabel={config.hero.ctaPrimary.label}
                hintId="hero-hold-hint"
                onConfirm={() => navigate(config.hero.ctaPrimary.href)}
                featured
                className="w-full px-6 py-3 text-sm font-medium tracking-wide sm:w-auto"
              />

              <motion.button
                type="button"
                onClick={() => navigate(config.hero.ctaSecondary.href)}
                aria-label={config.hero.ctaSecondary.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: FLUID_EASE }}
                className="btn-secondary-nex w-full px-6 py-3 text-sm font-medium tracking-wide sm:w-auto"
              >
                {config.hero.ctaSecondary.label}
              </motion.button>
            </motion.div>

            <motion.p
              id="hero-hold-hint"
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...ENTER.transition, delay: 0.32 }}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 will-change-transform"
            >
              Pressione para iniciar
            </motion.p>
          </div>

          <motion.div
            variants={reduce ? undefined : STAGGER_PARENT}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12 md:[grid-auto-flow:dense] md:gap-5"
          >
            {BENTO_CARDS.map((card: BentoCardData) => (
              <BentoCard key={card.id} card={card} reduceMotion={reduce} />
            ))}
          </motion.div>
        </div>
      </section>
    );
  },
);

HeroComponent.displayName = 'Hero';

export const Hero = HeroComponent;
export default Hero;
