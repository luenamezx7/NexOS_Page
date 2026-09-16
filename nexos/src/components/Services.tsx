'use client';

import { useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { Button } from './ui/Button';

interface StripeExtended extends Stripe {
  redirectToCheckout: (options: {
    mode: 'payment' | 'subscription' | 'setup';
    lineItems: Array<{ price: string; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<{ error?: { message: string } }>;
}

let stripePromise: Promise<StripeExtended | null>;

function getStripe(): Promise<StripeExtended | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey) as Promise<StripeExtended | null>;
  }
  return stripePromise;
}

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

interface ServiceCardProps {
  service: Service;
  reduceMotion: boolean;
}

function ServiceCard({ service, reduceMotion }: ServiceCardProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleCheckout = async (priceId: string): Promise<void> => {
    setLoading(true);
    try {
      const stripe: StripeExtended | null = await getStripe();
      if (!stripe) throw new Error('Stripe não carregou');

      const { error } = await stripe.redirectToCheckout({
        mode: 'payment',
        lineItems: [{ price: priceId, quantity: 1 }],
        successUrl: config.stripe.successUrl,
        cancelUrl: config.stripe.cancelUrl,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert('Erro ao redirecionar para pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className="bento-card will-change-transform flex flex-col p-7 transition-colors duration-300 hover:border-white/25 md:p-8"
      aria-labelledby={`service-title-${service.id}`}
    >
      <div className="mb-5 flex flex-row items-start justify-between gap-3">
        <span className="tech-badge">
          <span className="tech-badge-dot" aria-hidden="true" />
          {service.id}
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight text-white">
          R$ {service.price.toLocaleString('pt-BR')}
        </span>
      </div>

      <h3 id={`service-title-${service.id}`} className="mb-2 text-xl font-bold tracking-tight text-white">
        {service.title}
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-white/70">{service.description}</p>

      <ul className="mb-7 space-y-2.5" role="list" aria-label={`${service.title} — características`}>
        {service.features.map((feature: string) => (
          <li key={feature} className="flex flex-row items-start gap-2.5 text-sm leading-relaxed text-white/70">
            <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#ff2e6a]" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-white/10 pt-5">
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          onClick={() => handleCheckout(service.stripePriceId)}
          aria-label={`${service.ctaText} — R$ ${service.price.toLocaleString('pt-BR')}`}
        >
          {service.ctaText}
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </Button>
      </div>
    </motion.article>
  );
}

interface ServicesProps {
  className?: string;
}

export function Services({ className = '' }: ServicesProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className={`relative border-t border-white/10 bg-[#050505] ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mb-12 max-w-2xl will-change-transform md:mb-16"
        >
          <h2 id="services-title" className="flex flex-row items-start gap-3 text-white">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Serviços
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            Três pilares para transformar sua ideia em produto escalável. Escolha o que faz sentido para o seu momento.
          </p>
        </motion.header>

        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
          role="list"
          aria-label="Lista de serviços"
        >
          {config.services.map((service: Service) => (
            <ServiceCard key={service.id} service={service} reduceMotion={reduce} />
          ))}
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mt-10 flex flex-row items-center justify-center gap-2.5 text-center text-sm text-white/45 will-change-transform"
        >
          <ShieldCheck size={16} strokeWidth={2} className="shrink-0 text-white/45" aria-hidden="true" />
          <span>Pagamento seguro via Stripe. Redirecionamento automático para WhatsApp após confirmação.</span>
        </motion.div>
      </div>
    </section>
  );
}
