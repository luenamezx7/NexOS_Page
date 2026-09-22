'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Check, ShieldCheck, Code2, Palette, Zap, ArrowRight, Clock, Headphones, Rocket } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { HoldButton } from './HoldButton';
import GradientText from './GradientText';

// Drawer fora do bundle inicial E fora do DOM: o chunk só baixa quando
// o usuário segura o botão de compra (mount condicional abaixo).
const EmbeddedCheckoutDrawer = dynamic(
  () => import('./EmbeddedCheckout').then((m) => m.EmbeddedCheckoutDrawer),
  { ssr: false },
);

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

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  dev: <Code2 size={20} strokeWidth={1.75} aria-hidden="true" />,
  placa: <Palette size={20} strokeWidth={1.75} aria-hidden="true" />,
  teste: <Zap size={20} strokeWidth={1.75} aria-hidden="true" />,
};

const SERVICE_METRICS: Record<string, { value: string; label: string }[]> = {
  dev: [
    { value: '<2s', label: 'tempo de carregamento' },
    { value: '99.9%', label: 'uptime garantido' },
    { value: '100%', label: 'código documentado' },
  ],
  placa: [
    { value: '<1s', label: 'tempo de aproximação' },
    { value: '2em', label: 'espessura acrílico' },
    { value: '3 dias', label: 'envio após pedido' },
  ],
  teste: [
    { value: 'R$5', label: 'mínimo Asaas' },
    { value: '0', label: 'dados bancários' },
    { value: '24h', label: 'suporte ativo' },
  ],
};

interface ServiceCardProps {
  service: Service;
  reduceMotion: boolean;
  onCheckout: (s: Service) => void;
}

function ServiceCard({ service, reduceMotion, onCheckout }: ServiceCardProps) {
  const metrics = SERVICE_METRICS[service.id] ?? [];
  const icon = SERVICE_ICONS[service.id] ?? <Code2 size={20} strokeWidth={1.75} aria-hidden="true" />;
  const isFeatured = service.id === 'dev';

  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className={`bento-card will-change-transform group relative flex min-w-0 max-w-full flex-col p-5 transition-colors duration-300 hover:border-ink/25 sm:p-8 ${
        isFeatured
          ? '!border-pink-500/50 shadow-[0_0_28px_rgba(255,92,138,0.22),0_18px_60px_-24px_rgba(255,92,138,0.45)] md:col-span-2'
          : ''
      }`}
      aria-labelledby={`service-title-${service.id}`}
    >
      {isFeatured && (
        <span className="absolute -top-3 left-5 inline-flex max-w-[calc(100%-2.5rem)] items-center gap-1.5 truncate rounded-full border border-pink-500/50 bg-[#ff5c8a] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_16px_rgba(255,92,138,0.6)] sm:left-6">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-white" aria-hidden="true" />
          Mais Popular
        </span>
      )}

      <div className="mb-5 flex min-w-0 flex-row flex-wrap items-center justify-between gap-2 sm:gap-3">
        <span className={`tech-badge ${isFeatured ? '!border-pink-500/50 !text-ink' : ''}`}>
          <span className="tech-badge-dot" aria-hidden="true" />
          {service.id}
        </span>
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors duration-300 ${
            isFeatured
              ? 'border-pink-500/40 bg-[#ff5c8a]/10 text-[#ff5c8a] group-hover:border-pink-500/60 group-hover:bg-[#ff5c8a]/15'
              : 'border-ink/10 bg-ink/[0.04] text-ink/70 group-hover:border-pink-500/40 group-hover:text-ink'
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <h3 id={`service-title-${service.id}`} className="mb-2 break-words text-lg font-bold tracking-tight text-ink sm:text-xl">
        {service.title}
      </h3>
      <p className="mb-6 break-words text-sm leading-relaxed text-ink/70">{service.description}</p>

      {/* Métricas — valores em destaque */}
      {metrics.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3" role="list" aria-label={`Métricas de ${service.title}`}>
          {metrics.map((m) => (
            <div key={m.label} className="group/metric rounded-xl border border-ink/10 bg-[var(--color-card)] px-3 py-3 text-center shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-colors hover:border-[#ff5c8a]/20 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-display text-xl font-black tracking-tighter leading-none sm:text-2xl">
                <span className="bg-gradient-to-r from-[#ff5c8a] via-[#83358F] to-[#ff5c8a] bg-clip-text text-transparent">{m.value}</span>
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/45 dark:text-white/45">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <ul className="mb-7 space-y-2.5" role="list" aria-label={`${service.title} — características`}>
        {service.features.map((feature: string) => (
          <li key={feature} className="flex flex-row items-start gap-2.5 text-sm leading-relaxed text-ink/70">
            <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#ff5c8a]" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-ink/10 pt-5">
        <div className="mb-4 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-3xl font-black tracking-tighter leading-none sm:text-4xl">
            <span className="bg-gradient-to-r from-[#ff5c8a] via-[#83358F] to-[#ff5c8a] bg-clip-text text-transparent">R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          {service.id === 'dev' && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">/mês</span>
          )}
          {service.id === 'placa' && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">/unidade</span>
          )}
        </div>
        <HoldButton
          label={service.ctaText}
          ariaLabel={`${service.ctaText} — R$ ${service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hintId={`service-hold-hint-${service.id}`}
          onConfirm={() => onCheckout(service)}
          className="w-full py-3 text-sm font-semibold tracking-wide"
        />
        <p id={`service-hold-hint-${service.id}`} className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
          Segure para confirmar
        </p>
      </div>
    </motion.article>
  );
}

const DIFFERENTIALS = [
  {
    icon: <Rocket size={18} strokeWidth={1.75} aria-hidden="true" />,
    title: 'Entrega Ágil',
    description: 'Metodologia enxuta que reduz tempo de desenvolvimento sem sacrificar qualidade.',
  },
  {
    icon: <Clock size={18} strokeWidth={1.75} aria-hidden="true" />,
    title: 'Suporte Contínuo',
    description: 'Acompanhamento pós-entrega para garantir performance e estabilidade.',
  },
  {
    icon: <Headphones size={18} strokeWidth={1.75} aria-hidden="true" />,
    title: 'Comunicação Direta',
    description: 'Acesso direto ao time de desenvolvimento, sem intermediários.',
  },
  {
    icon: <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />,
    title: 'Pagamento Seguro',
    description: 'Pix, boleto e cartão em até 12x via Asaas — confirmação automática.',
  },
];

interface ServicesProps {
  className?: string;
}

export function Services({ className = '' }: ServicesProps) {
  const reduce = useReducedMotion() ?? false;
  const [activeService, setActiveService] = useState<Service | null>(null);

  const handleCheckout = useCallback((service: Service) => {
    setActiveService(service);
  }, []);

  const handleClose = useCallback(() => {
    setActiveService(null);
  }, []);

  return (
    <>
      <section
        id="services"
        aria-labelledby="services-title"
        className={`relative w-full max-w-full overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
      >
        <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 md:px-8 md:py-32">
          {/* Header da seção */}
          <motion.header
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="mb-12 max-w-2xl will-change-transform md:mb-16"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ff5c8a]/40 bg-[#ff5c8a]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff5c8a]">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff5c8a]" aria-hidden="true" />
              Soluções completas
            </p>
            <h2 id="services-title" className="flex flex-row items-start gap-3 text-ink">
              <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
              <span>
                Nossos{' '}
                <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>
                  Serviços
                </GradientText>
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70 md:text-lg">
              Desenvolvimento sob medida, hardware inteligente e validação de checkout. Escolha o que faz sentido para o seu momento — cada serviço é entregue com qualidade técnica e suporte dedicado.
            </p>
          </motion.header>

          {/* Grid de serviços */}
          <motion.div
            variants={reduce ? undefined : STAGGER_PARENT}
            initial={reduce ? { opacity: 0 } : 'hidden'}
            whileInView={reduce ? { opacity: 1 } : 'show'}
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8"
            role="list"
            aria-label="Lista de serviços"
          >
            {/* A placa sai daqui: checkout dela abre só na seção da plaquinha */}
            {config.services
              .filter((service: Service) => service.id !== 'placa')
              .map((service: Service) => (
              <ServiceCard key={service.id} service={service} reduceMotion={reduce} onCheckout={handleCheckout} />
            ))}

            {/* Em breve — nova aplicação NexOS */}
            <motion.div
              variants={reduce ? undefined : RELIEF_CHILD}
              initial={reduce ? { opacity: 0 } : undefined}
              whileInView={reduce ? { opacity: 1 } : undefined}
              viewport={{ once: true, amount: 0.25 }}
              transition={reduce ? { duration: 0.4 } : undefined}
              className="bento-card will-change-transform group relative flex min-w-0 max-w-full flex-col items-center justify-center p-8 text-center md:col-span-2"
            >
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#83358F]/40 bg-[#83358F]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#83358F]">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#83358F]" aria-hidden="true" />
                Em desenvolvimento
              </span>
              <h3 className="mb-2 text-lg font-bold tracking-tight text-ink sm:text-xl">Nova Aplicação NexOS</h3>
              <p className="max-w-md text-sm leading-relaxed text-ink/60">
                Estamos construindo uma nova plataforma para expandir ainda mais nossos serviços. Em breve, novidades que vão transformar a forma como você cria e gerencia seus projetos digitais.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-ink/40">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#83358F]/40" aria-hidden="true" />
                <span className="font-mono uppercase tracking-[0.14em]">Stay tuned</span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#83358F]/40" aria-hidden="true" />
              </div>
            </motion.div>
          </motion.div>

          {/* Diferenciais */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="mt-16 will-change-transform md:mt-20"
          >
            <div className="mb-8 text-center">
              <h3 className="text-lg font-bold tracking-tight text-ink sm:text-xl">Por que escolher a NexOS?</h3>
              <p className="mt-2 text-sm text-ink/60">Compromisso com qualidade em cada etapa do projeto.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DIFFERENTIALS.map((d, i) => (
                <motion.div
                  key={d.title}
                  variants={reduce ? undefined : RELIEF_CHILD}
                  initial={reduce ? { opacity: 0 } : undefined}
                  whileInView={reduce ? { opacity: 1 } : undefined}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={reduce ? { duration: 0.4 } : undefined}
                  className="flex flex-col items-center rounded-2xl border border-ink/10 bg-[var(--color-card)] px-5 py-6 text-center transition-colors duration-300 hover:border-ink/20 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20"
                >
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#ff5c8a]/10 text-[#ff5c8a]">
                    {d.icon}
                  </span>
                  <h4 className="mb-1 text-sm font-bold tracking-tight text-ink dark:text-white">{d.title}</h4>
                  <p className="text-xs leading-relaxed text-ink/60 dark:text-white/60">{d.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust badge */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="mt-12 flex flex-row items-center justify-center gap-2.5 text-center text-sm text-ink/45 will-change-transform"
          >
            <ShieldCheck size={16} strokeWidth={2} className="shrink-0 text-ink/45" aria-hidden="true" />
            <span>Pix, boleto e cartão em até 12x via Asaas — confirmação automática.</span>
          </motion.div>
        </div>
      </section>

      {/* Checkout — só monta (e baixa o chunk) após o hold do botão */}
      {activeService && (
        <EmbeddedCheckoutDrawer
          open
          onClose={handleClose}
          productId={activeService.id}
          productTitle={activeService.title}
          productPrice={activeService.price}
        />
      )}
    </>
  );
}
