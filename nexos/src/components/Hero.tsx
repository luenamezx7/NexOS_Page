'use client';

/** Rose-purple display type, sparkling ASCII flow and an editorial benefits grid. */
import { forwardRef, useEffect, type ForwardedRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, ArrowUpRight, Zap, Layers, Gauge, Sparkles } from 'lucide-react';
import { config } from '@/config';
import { HoverLink } from './ui/hover-button';
import styles from './MidPage.module.css';
import { useTheme } from './ThemeProvider';
import { useDesktopEffects } from '@/lib/use-desktop-effects';

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
}

function BentoCard({ card }: BentoCardProps) {
  return (
    <article
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
        <a
          href={card.ctaHref}
          aria-label={card.ctaLabel}
          className="btn-secondary-nex"
        >
          <span>{card.ctaLabel}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

const HeroComponent = forwardRef<HTMLElement, HeroProps>(
  ({ className = '' }: HeroProps, ref: ForwardedRef<HTMLElement>) => {
    const { theme } = useTheme();
    const effects = useDesktopEffects();

    useEffect(() => {
      const hero = document.getElementById('hero');
      const atmosphere = document.querySelector<HTMLElement>('.site-atmosphere');
      if (!hero || !atmosphere) return;
      // Emphasize the single shared star field; do not mount a second canvas here.
      const observer = new IntersectionObserver(([entry]) => {
        atmosphere.dataset.heroActive = entry.isIntersecting ? 'true' : 'false';
      }, { threshold: 0.1 });
      observer.observe(hero);
      return () => { observer.disconnect(); delete atmosphere.dataset.heroActive; };
    }, []);

    return (
      <>
        <section
          ref={ref}
          id="hero"
          tabIndex={-1}
          aria-labelledby="hero-title"
          className={`landing-hero relative flex min-h-[100dvh] w-full max-w-full items-center overflow-hidden ${className}`}
        >
          {effects && theme === 'dark' && <div className="hero-veil" aria-hidden="true"><DarkVeil /></div>}
          <div className="hero-coordinate" aria-hidden="true">NEXOS / DIGITAL STUDIO</div>
          <div className="hero-container">
            <div className="hero-copy">
              <div className="mb-6">
                <span className="tech-badge">
                  <span className="tech-badge-dot" aria-hidden="true" />
                  Design + código + estratégia
                </span>
              </div>

              <h1
                id="hero-title"
                className="hero-heading"
              >
                Sites para<br />
                <span className="hero-accent">seu negócio.</span>
              </h1>

              <p
                className="hero-description"
              >
                A {config.brand.fullName} cria sites, landing pages e cardápios digitais. Conecte seu atendimento presencial com placas NFC e QR Code.
              </p>

              <div
                className="hero-actions"
              >
                <HoverLink
                  href={config.hero.ctaPrimary.href}
                  aria-label={config.hero.ctaPrimary.label}
                >
                  {config.hero.ctaPrimary.label}
                </HoverLink>

                <a
                  href={config.hero.ctaSecondary.href}
                  aria-label={config.hero.ctaSecondary.label}
                  className="hero-secondary"
                >
                  {config.hero.ctaSecondary.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="benefits-title" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionNav} aria-label="Navegação de benefícios">
              <span className={styles.currentSection}><Sparkles size={16} aria-hidden="true" /> Por que a NexOS</span>
              <a href="#showcase">Conhecer a Placa NFC <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <header
              className={styles.header}
            >
              <h2 id="benefits-title" className={styles.heading}>
                Do primeiro pixel ao<br /><span className={styles.accent}>pagamento aprovado.</span>
              </h2>
              <p className={styles.lead}>
                Marca, performance e conversão no mesmo lugar — sem trocar de agência a cada etapa.
              </p>
            </header>
            <div
              className={styles.bentoGrid}
            >
              {BENTO_CARDS.map((card: BentoCardData) => (
                <BentoCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  },
);

HeroComponent.displayName = 'Hero';

export const Hero = HeroComponent;
export default Hero;
