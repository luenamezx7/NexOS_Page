'use client';

/** Rose-purple display type, sparkling ASCII flow and an editorial benefits grid. */
import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, ArrowUpRight, Zap, Layers, Gauge, Sparkles } from 'lucide-react';
import { config } from '@/config';
import GradientText from './GradientText';
import { Slipstream } from './ui/background-ascii-flow';
import { HoverButton } from './ui/hover-button';
import styles from './MidPage.module.css';
import { useTheme } from './ThemeProvider';

const DarkVeil = dynamic(() => import('./DarkVeil'), { ssr: false });

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
  span: 'span7' | 'span5';
  featured?: boolean;
  featuredBadge?: string;
}

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ENTER = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
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

function navigate(href: string, push?: (h: string) => void): void {
  if (href.startsWith('#')) {
    const el: HTMLElement | null = document.getElementById(href.replace('#', ''));
    if (el) {
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      return;
    }
  }
  if (push) push(href);
  else window.location.href = href;
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
    span: 'span7',
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
    span: 'span5',
    featured: true,
    featuredBadge: 'Destaque B2B',
  },
  {
    id: 'strategy',
    badge: 'Discovery',
    title: 'A melhor estratégia para seu Business',
    description:
      'Validação de produto, roadmap técnico e plano de execução de 90 dias antes de investir em código.',
    metricValue: '6 sem',
    metricLabel: 'MVP médio',
    ctaLabel: 'Agendar Discovery',
    ctaHref: '#contact',
    icon: <Gauge size={18} strokeWidth={1.75} aria-hidden="true" />,
    span: 'span5',
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
    span: 'span7',
  },
];

interface BentoCardProps {
  card: BentoCardData;
  reduceMotion: boolean;
}

function BentoCard({ card, reduceMotion }: BentoCardProps) {
  const router = useRouter();
  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      className={`${styles.bentoCard} ${card.featured ? styles.featured : ''} ${styles[card.span]}`}
      aria-labelledby={`bento-title-${card.id}`}
    >
      {card.featured && card.featuredBadge && (
        <span className={styles.featuredBadge}>
          <span className={styles.featuredBadgeDot} aria-hidden="true" />
          {card.featuredBadge}
        </span>
      )}
      <div className={styles.cardTop}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          {card.badge}
        </span>
        <span className={styles.iconBox} aria-hidden="true">
          {card.icon}
        </span>
      </div>

      <h3 id={`bento-title-${card.id}`}>{card.title}</h3>
      <p>{card.description}</p>

      <div className={styles.metric}>
        <span className={styles.metricValue}>{card.metricValue}</span>
        <span className={styles.metricLabel}>{card.metricLabel}</span>
      </div>

      <div className={styles.cardAction}>
        <button
          type="button"
          onClick={() => navigate(card.ctaHref, router.push)}
          aria-label={card.ctaLabel}
          className="btn-secondary-nex"
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
    const router = useRouter();
    const { theme } = useTheme();

    return (
      <>
        <section
          ref={ref}
          id="hero"
          aria-labelledby="hero-title"
          className={`landing-hero relative flex min-h-[100dvh] w-full max-w-full items-center overflow-hidden ${className}`}
        >
          {theme === 'dark' && <div className="hero-veil" aria-hidden="true"><DarkVeil /></div>}
          <div className="hero-flow" aria-hidden="true"><Slipstream density={1.7} seed={913} /></div>
          <div className="hero-coordinate" aria-hidden="true">NEXOS / DIGITAL STUDIO</div>
          <div className="hero-container">
            <div className="hero-copy">
              <motion.div
                initial={reduce ? { opacity: 0 } : ENTER.initial}
                whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
                viewport={{ once: true, amount: 0.6 }}
                transition={ENTER.transition}
                className="mb-6 will-change-transform"
              >
                <span className="tech-badge">
                  <span className="tech-badge-dot" aria-hidden="true" />
                  Design + código + estratégia
                </span>
              </motion.div>

              <motion.h1
                id="hero-title"
                initial={reduce ? { opacity: 0 } : ENTER.initial}
                whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ ...ENTER.transition, delay: 0.08 }}
                className="hero-heading"
              >
                Seu negócio.<br />
                <GradientText colors={['var(--display-rose)', 'var(--display-purple)', 'var(--display-rose)']} animationSpeed={12}>Em outra escala.</GradientText>
              </motion.h1>

              <motion.p
                initial={reduce ? { opacity: 0 } : ENTER.initial}
                whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ ...ENTER.transition, delay: 0.16 }}
                className="hero-description"
              >
                Construímos experiências digitais que conectam sua marca, seus clientes e seu próximo passo.
              </motion.p>

              <motion.div
                initial={reduce ? { opacity: 0 } : ENTER.initial}
                whileInView={reduce ? { opacity: 1 } : ENTER.whileInView}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ ...ENTER.transition, delay: 0.24 }}
                className="hero-actions"
              >
                <HoverButton
                  onClick={() => navigate(config.hero.ctaPrimary.href, router.push)}
                  aria-label={config.hero.ctaPrimary.label}
                >
                  {config.hero.ctaPrimary.label}
                </HoverButton>

                <motion.button
                  type="button"
                  onClick={() => navigate(config.hero.ctaSecondary.href, router.push)}
                  aria-label={config.hero.ctaSecondary.label}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: FLUID_EASE }}
                  className="hero-secondary"
                >
                  {config.hero.ctaSecondary.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        <section aria-labelledby="benefits-title" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionNav} aria-label="Navegação de benefícios">
              <span className={styles.currentSection}><Sparkles size={16} aria-hidden="true" /> Por que a NexOS</span>
              <a href="#showcase">Conhecer a Placa NFC <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <motion.header
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: FLUID_EASE }}
              className={styles.header}
            >
              <h2 id="benefits-title" className={styles.heading}>
                Do primeiro pixel ao<br /><span className={styles.accent}>pagamento aprovado.</span>
              </h2>
              <p className={styles.lead}>
                Marca, performance e conversão no mesmo lugar — sem trocar de agência a cada etapa.
              </p>
            </motion.header>
            <motion.div
              variants={reduce ? undefined : STAGGER_PARENT}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.12 }}
              className={styles.bentoGrid}
            >
              {BENTO_CARDS.map((card: BentoCardData) => (
                <BentoCard key={card.id} card={card} reduceMotion={reduce} />
              ))}
            </motion.div>
          </div>
        </section>
      </>
    );
  },
);

HeroComponent.displayName = 'Hero';

export const Hero = HeroComponent;
export default Hero;
