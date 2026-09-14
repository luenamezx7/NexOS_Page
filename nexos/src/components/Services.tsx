'use client';

import { useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import styles from './Services.module.css';
import { config } from '@/config';
import { Button } from './ui/Button';
import { Check, ArrowRight, ExternalLink } from 'lucide-react';
import { SlideUpText } from './SlideUpText';

interface StripeExtended extends Stripe {
  redirectToCheckout: (options: {
    mode: 'payment' | 'subscription' | 'setup';
    lineItems: Array<{ price: string; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<{ error?: { message: string } }>;
}

let stripePromise: Promise<StripeExtended | null>;

function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey) as Promise<StripeExtended | null>;
  }
  return stripePromise;
}

interface ServiceCardProps {
  service: typeof config.services[0];
}

function ServiceCard({ service }: ServiceCardProps) {
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const stripe = await getStripe();
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
    <article
      className={`${styles.card} ${hovered ? styles.hovered : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.cardGlow} aria-hidden="true" />
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{service.title}</h3>
        <span className={styles.price}>R$ {service.price.toLocaleString('pt-BR')}</span>
      </div>
      <p className={styles.description}>{service.description}</p>
      <ul className={styles.features} role="list" aria-label={`${service.title} - características`}>
        {service.features.map((feature, i) => (
          <li key={i} className={styles.feature}>
            <Check size={16} strokeWidth={2.5} className={styles.checkIcon} aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        size="md"
        fullWidth
        loading={loading}
        onClick={() => handleCheckout(service.stripePriceId)}
        aria-label={`${service.ctaText} - R$ ${service.price.toLocaleString('pt-BR')}`}
      >
        {service.ctaText}
        <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
      </Button>
    </article>
  );
}

export function Services() {
  return (
    <section id="services" className={styles.section} aria-labelledby="services-title">
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <h2 id="services-title" className={styles.sectionTitle}>
            <SlideUpText
              split="words"
              stagger={0.08}
              delay={0.1}
              inView={true}
              transition={{ type: 'tween', ease: [0.625, 0.05, 0, 1], duration: 0.6 }}
            >
              Serviços
            </SlideUpText>
          </h2>
          <p className={styles.sectionSubtitle}>
            Três pilares para transformar sua ideia em produto escalável. Escolha o que faz sentido para o seu momento.
          </p>
        </header>
        <div className={styles.grid} role="list" aria-label="Lista de serviços">
          {config.services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        <div className={styles.note}>
          <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
          <span>Pagamento seguro via Stripe. Redirecionamento automático para WhatsApp após confirmação.</span>
        </div>
      </div>
    </section>
  );
}