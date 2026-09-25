'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Code2, CreditCard, Headphones, Layers, Plus } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { BULK_MAX_QTY } from '@/lib/bulk-pricing';
import { HoldButton } from './HoldButton';
import styles from './commerce/Commerce.module.css';

const EmbeddedCheckoutDrawer = dynamic(() => import('./EmbeddedCheckout').then(m => m.EmbeddedCheckoutDrawer), { ssr: false });
const EASE = [0.16, 1, 0.3, 1] as const;

function ServiceCard({ service, onCheckout }: { service: Service; onCheckout: (service: Service) => void }) {
  const reduce = useReducedMotion();
  const featured = service.id === 'dev';
  const testing = service.id === 'teste';
  return (
    <motion.article initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55, ease: EASE }} className={`${styles.serviceCard} ${featured ? styles.featured : ''}`} aria-labelledby={`service-title-${service.id}`}>
      <div className={styles.cardTop}>
        <span className={styles.serviceIcon}>{testing ? <CreditCard size={22} strokeWidth={1.75} aria-hidden="true" /> : <Code2 size={22} strokeWidth={1.75} aria-hidden="true" />}</span>
        <span className={styles.meta}>{featured ? 'Feito para o seu negócio' : testing ? 'Validação técnica' : 'Solução NexOS'}</span>
      </div>
      <div className={styles.serviceBody}>
        <div>
          <h3 id={`service-title-${service.id}`}>{testing ? 'Teste de checkout' : service.title}</h3>
          <p>{testing ? 'Confira o fluxo de pagamento integrado ao Asaas. O valor desta cobrança é de R$ 5,00.' : service.description}</p>
          {featured && <div className={styles.useCases} aria-label="Aplicações"><span>Landing pages</span><span>Cardápios</span><span>Portfólios</span></div>}
        </div>
        <ul className={styles.features}>{service.features.map(feature => <li key={feature}><Check size={16} strokeWidth={2} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
      </div>
      <div className={styles.serviceFooter}>
        <div><p className={styles.price}>R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><span className={styles.meta}>{featured ? 'por mês' : 'pagamento único'}</span></div>
        <div className={styles.serviceAction}>
          <HoldButton label={featured ? 'Iniciar projeto' : testing ? 'Testar checkout' : service.ctaText} ariaLabel={`${featured ? 'Iniciar projeto' : testing ? 'Testar checkout' : service.ctaText}, R$ ${service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} hintId={`service-hold-${service.id}`} onConfirm={() => onCheckout(service)} className={styles.buyButton} />
          <p id={`service-hold-${service.id}`} className={styles.hint}>Segure para abrir o checkout.</p>
        </div>
      </div>
    </motion.article>
  );
}

const DIFFERENTIALS = [
  { icon: Layers, title: 'Do primeiro esboço à entrega', description: 'Estrutura, design e desenvolvimento pensados juntos.' },
  { icon: Headphones, title: 'Conversa direta', description: 'Fale com quem está construindo o seu projeto.' },
  { icon: CreditCard, title: 'Checkout integrado', description: 'Boleto e cartão via Asaas, com confirmação automática.' },
];

export function Services({ className = '' }: { className?: string }) {
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = config.services.find(s => s.id === params.get('checkout'));
    if (!service) return;
    const requested = Number(params.get('quantity') ?? 1);
    const frame = requestAnimationFrame(() => {
      setQuantity(Number.isInteger(requested) && requested >= 1 && requested <= BULK_MAX_QTY ? requested : 1);
      setActiveService(service);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const closeCheckout = useCallback(() => {
    setActiveService(null);
    setQuantity(1);
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout'); url.searchParams.delete('quantity');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);
  return (
    <>
      <section id="services" aria-labelledby="services-title" className={`${styles.section} ${styles.servicesSection} ${className}`}>
        <div className={styles.container}>
          <div className={styles.sectionNav}>
            <span className={styles.currentSection}><Code2 size={16} aria-hidden="true" /> Serviços digitais</span>
            <a href="#showcase">Conhecer a Placa NFC <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <header className={styles.servicesHeader}>
            <h2 id="services-title" className={styles.heading}>Ideias boas merecem<br /><span className={styles.accent}>sair do papel.</span></h2>
            <p className={styles.lead}>Escolha a solução para o seu próximo passo. A NexOS cuida do design, da construção e dos detalhes.</p>
          </header>
          <div className={styles.servicesGrid}>
            {config.services.filter(service => service.id !== 'placa').map(service => <ServiceCard key={service.id} service={service} onCheckout={setActiveService} />)}
            <aside className={styles.upcoming}>
              <span className={styles.meta}><Plus size={16} aria-hidden="true" /> Em desenvolvimento</span>
              <h3>O próximo capítulo da NexOS.</h3>
              <p>Estamos preparando novas ferramentas para o seu negócio. Quer conversar sobre uma ideia?</p>
              <a href="#contact" className={styles.textLink}>Falar sobre meu projeto <ArrowUpRight size={16} aria-hidden="true" /></a>
            </aside>
          </div>
          <div className={styles.differentials}>{DIFFERENTIALS.map(({ icon: Icon, title, description }) => <div key={title}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>)}</div>
        </div>
      </section>
      {activeService && <EmbeddedCheckoutDrawer open onClose={closeCheckout} productId={activeService.id} productTitle={activeService.title} productPrice={activeService.price} quantity={quantity} />}
    </>
  );
}
