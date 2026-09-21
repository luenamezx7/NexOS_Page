'use client';

import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, ArrowUpRight, Zap, Layers, Gauge } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { config } from '@/config';
import GradientText from './GradientText';




// Lazy (abaixo): DarkVeil (WebGL/ogl ~700KB) e Grainient (canvas) saem do
// bundle inicial. `ssr: false` porque canvas/WebGL não renderizam no
// servidor. O fallback estático mantém o fundo idêntico durante o load.
function VeilFallback() {
  return <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,rgba(255, 92, 138,0.14),transparent_75%)]" aria-hidden="true" />;
}

const DarkVeil = dynamic(() => import('./DarkVeil'), {
  ssr: false,
  loading: VeilFallback,
});

const Grainient = dynamic(() => import('./Grainient'), {
  ssr: false,
  loading: VeilFallback,
});

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
      className={`bento-card will-change-transform group relative flex min-w-0 max-w-full flex-col p-5 transition-colors duration-300 hover:border-ink/25 sm:p-8 md:p-7 ${card.span} ${
        card.featured
          ? '!border-pink-500/50 shadow-[0_0_28px_rgba(255, 92, 138,0.22),0_18px_60px_-24px_rgba(255, 92, 138,0.45)]'
          : ''
      }`}
      aria-labelledby={`bento-title-${card.id}`}
    >
      {card.featured && card.featuredBadge && (
        <span className="absolute -top-3 left-5 inline-flex max-w-[calc(100%-2.5rem)] items-center gap-1.5 truncate rounded-full border border-pink-500/50 bg-[#ff5c8a] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_16px_rgba(255, 92, 138,0.6)] sm:left-6">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-white" aria-hidden="true" />
          {card.featuredBadge}
        </span>
      )}
      <div className="mb-5 flex min-w-0 flex-row flex-wrap items-center justify-between gap-2 sm:gap-3">
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

      <h3 id={`bento-title-${card.id}`} className="font-dirty mb-2 break-words text-lg font-bold tracking-tight text-ink sm:text-xl">
        {card.id === 'performance-valor' ? (
          <>
            Performance que gera valor <span className="font-sans font-bold tracking-tight">B2B</span>
          </>
        ) : (
          card.title
        )}
      </h3>
      <p className="mb-5 break-words text-sm leading-relaxed text-ink/70">{card.description}</p>

      <div className="mb-6 flex min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{card.metricValue}</span>
        <span className="break-words font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">{card.metricLabel}</span>
      </div>

      <div className="mt-auto flex flex-row items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="button"
          onClick={() => navigate(card.ctaHref)}
          aria-label={card.ctaLabel}
          className="btn-secondary-nex w-full !justify-between touch-target"
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
        className={`relative w-full max-w-full overflow-hidden overflow-x-clip bg-canvas ${className}`}
      >
        {theme === 'dark' ? (
          <div className="veil-wrap" aria-hidden="true">
            <DarkVeil hueShift={340} noiseIntensity={0.08} speed={0.5} scanlineFrequency={0.3} warpAmount={3} />
          </div>
        ) : (
          <div className="veil-wrap opacity-35" aria-hidden="true">
            <Grainient
              color1="#fdf6ec"
              color2="#f5e6cc"
              color3="#fffaf2"
              lightMode={true}
              timeSpeed={0.18}
              warpStrength={0.6}
              warpFrequency={3.0}
              warpSpeed={1.0}
              warpAmplitude={30.0}
              grainAmount={0.03}
              grainScale={2.0}
              grainAnimated={false}
              contrast={1.05}
              gamma={1.0}
              saturation={0.35}
              zoom={0.95}
            />
          </div>
        )}
        <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-canvas"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 md:px-8 md:pb-32 md:pt-32">
          <div className="flex min-w-0 flex-col items-center text-center">
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
              className="font-dirty w-full max-w-5xl text-balance break-words text-[1.75rem] font-black leading-[1.08] tracking-[-0.02em] text-ink will-change-transform sm:text-4xl sm:leading-[1.02] md:text-6xl lg:text-7xl"
            >
              Construímos{' '}
              <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>
                produtos digitais
              </GradientText>{' '}
              que{' '}
              <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>
                escalam
              </GradientText>
              .
            </motion.h1>

            <motion.p
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...ENTER.transition, delay: 0.16 }}
              className="mt-5 max-w-[62ch] break-words text-sm leading-relaxed text-ink/70 will-change-transform sm:text-base md:text-lg"
            >
              Da ideia ao mercado. Desenvolvimento, design e estratégia para startups e empresas que precisam de{' '}
              <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>
                <span className="font-semibold">velocidade</span>
              </GradientText>{' '}
              sem abrir mão da qualidade.
            </motion.p>

            <motion.div
              initial={reduce ? { opacity: 0 } : ENTER.initial}
              whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...ENTER.transition, delay: 0.24 }}
              className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 will-change-transform sm:flex-row sm:items-center"
            >
              <motion.button
                type="button"
                onClick={() => navigate(config.hero.ctaPrimary.href)}
                aria-label={config.hero.ctaPrimary.label}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: FLUID_EASE }}
                className="btn-primary-nex btn-primary-nex--featured w-full px-6 py-3 text-sm font-medium tracking-wide sm:w-auto"
              >
                {config.hero.ctaPrimary.label}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => navigate(config.hero.ctaSecondary.href)}
                aria-label={config.hero.ctaSecondary.label}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: FLUID_EASE }}
                className="btn-secondary-nex w-full px-6 py-3 text-sm font-medium tracking-wide touch-target sm:w-auto"
              >
                {config.hero.ctaSecondary.label}
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            variants={reduce ? undefined : STAGGER_PARENT}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12 md:[grid-auto-flow:dense] md:gap-5 lg:gap-8"
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
