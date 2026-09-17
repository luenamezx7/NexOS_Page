'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Cpu, Layers, CreditCard, ArrowRight } from 'lucide-react';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
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

// ============================================================
// NexOS Content Engineering Directive — Cards de Valor
// Substitui "Cases & Depoimentos" pelos 3 pilares oficiais
// ============================================================

interface ValueCard {
  id: string;
  overline: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  actionTag: string;
  actionHref: string;
  icon: React.ReactNode;
  pilar: string;
}

const VALUE_CARDS: ValueCard[] = [
  {
    id: 'BENTO_NFC_ACRYLIC',
    overline: 'TECNOLOGIA FÍSICA',
    title: 'Conexão por Aproximação Sem Atrito',
    description:
      'Placas de acrílico cristal cortadas a laser com NFC e QR Code integrado. Permitem que seu cliente acesse cardápios, portfólios ou redes sociais em menos de 1 segundo, eliminando barreiras no atendimento.',
    metric: 'Instantâneo',
    metricLabel: 'NFC / QR',
    actionTag: 'Adquirir em Lote',
    actionHref: '#services',
    icon: <Layers size={18} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 2 — DESIGN INDUSTRIAL-TECH',
  },
  {
    id: 'BENTO_EMBEDDED_CHECKOUT',
    overline: 'CHECKOUT TRANSPARENTE',
    title: 'Conversão Máxima Sem Redirecionamentos',
    description:
      'Processe pagamentos diretamente na sua landing page sem enviar o cliente para links externos. Reduza o abandono de carrinho mantendo a coesão visual e a confiança do comprador no mesmo ambiente.',
    metric: '+35%',
    metricLabel: 'taxa de finalização',
    actionTag: 'Ver Demonstração',
    actionHref: '#services',
    icon: <CreditCard size={18} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 3 — CONVERSÃO & RETENÇÃO',
  },
  {
    id: 'BENTO_PERFORMANCE_60FPS',
    overline: 'ENGINE & SPEED',
    title: 'Fluidez Imersiva a 60–120 FPS',
    description:
      'Arquitetura acelerada por GPU que garante navegação contínua e sem interrupções em qualquer dispositivo. Otimização severa que converte visitantes em clientes engajados.',
    metric: '< 0.8s',
    metricLabel: 'LCP / 120Hz',
    actionTag: 'Conhecer a Arquitetura',
    actionHref: '#hero',
    icon: <Cpu size={18} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 1 — PERFORMANCE ABSOLUTA',
  },
];

function navigate(href: string): void {
  const el = document.querySelector(href) as HTMLElement | null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.location.href = href;
}

function ValueCardComponent({ card, reduceMotion }: { card: ValueCard; reduceMotion: boolean }) {
  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className="bento-card will-change-transform group flex flex-col p-7 transition-colors duration-300 hover:border-ink/25 md:p-8"
      aria-labelledby={`value-title-${card.id}`}
    >
      <div className="mb-5 flex flex-row items-center justify-between gap-3">
        <span className="tech-badge">
          <span className="tech-badge-dot" aria-hidden="true" />
          {card.overline}
        </span>
        <span
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 bg-ink/[0.04] text-ink/70 transition-colors duration-300 group-hover:border-pink-500/40 group-hover:text-ink"
          aria-hidden="true"
        >
          {card.icon}
        </span>
      </div>

      <h3 id={`value-title-${card.id}`} className="mb-3 text-xl font-bold tracking-tight text-ink">
        {card.title}
      </h3>

      <p className="mb-6 text-sm leading-relaxed text-ink/70">{card.description}</p>

      <div className="mb-6 flex flex-row items-baseline gap-2 border-y border-ink/10 py-4">
        <span className="font-display text-2xl font-bold tracking-tight text-ink">{card.metric}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">{card.metricLabel}</span>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">{card.pilar}</span>
        <button
          type="button"
          onClick={() => navigate(card.actionHref)}
          aria-label={card.actionTag}
          className="btn-secondary-nex w-full !justify-between"
        >
          <span>{card.actionTag}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}

interface TestimonialsProps {
  className?: string;
}

export function Testimonials({ className = '' }: TestimonialsProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className={`relative border-t border-ink/10 bg-canvas ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mb-12 max-w-2xl will-change-transform md:mb-16"
        >
          <h2 id="testimonials-title" className="flex flex-row items-start gap-3 text-ink">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Ecossistema NexOS
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70 md:text-lg">
            Três pilares de valor para transformar tráfego em receita: performance absoluta, conexão físico-digital e conversão sem atrito.
          </p>
        </motion.header>

        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
          role="list"
          aria-label="Pilares de valor NexOS"
        >
          {VALUE_CARDS.map((card) => (
            <ValueCardComponent key={card.id} card={card} reduceMotion={reduce} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
