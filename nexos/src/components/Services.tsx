'use client';

/** Service discovery and direct commercial consultation. */
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ArrowUpRight, Check, Code2, MessageSquare, Headphones, Layers } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { commercialHref } from '@/lib/commercial';
import { MetallicSurface } from './ui/metallic-button';
import { ServiceExplorer, type ServiceGoal } from './ServiceExplorer';
import styles from './commerce/Commerce.module.css';

const EASE = [0.16, 1, 0.3, 1] as const;

function ServiceCard({ service }: { service: Service }) {
  const reduce = useReducedMotion();
  const featured = service.id === 'dev';
  return (
    <motion.article initial={reduce ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} whileHover={reduce ? undefined : { y: -5 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, ease: EASE }} className={`${styles.serviceCard} ${featured ? styles.featured : ''}`} aria-labelledby={`service-title-${service.id}`}>
      <div className={styles.cardTop}>
        <span className={styles.serviceIcon}><Code2 size={22} strokeWidth={1.75} aria-hidden="true" /></span>
        <span className={styles.meta}>Feito para o seu negócio</span>
      </div>
      <div className={styles.serviceBody}>
        <div>
          <h3 id={`service-title-${service.id}`}>{service.title}</h3>
          <p>{service.description}</p>
          <p>Da organização do conteúdo à publicação, pensamos em como seu cliente encontra informações, conhece sua oferta e entra em contato. Você conversa diretamente com a equipe que vai construir a solução.</p>
          {featured && <div className={styles.useCases} aria-label="Conheça cada solução"><Link href="/landing-pages" className="hover:underline">Landing pages</Link><Link href="/cardapio-digital" className="hover:underline">Cardápios</Link><Link href="/criacao-de-sites" className="hover:underline">Sites e portfólios</Link></div>}
        </div>
        <ul className={styles.features}>{service.features.map(feature => <li key={feature}><Check size={16} strokeWidth={2} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
      </div>
      <div className={styles.serviceFooter}>
        <div><h4 className={styles.commercialHeading}>Uma proposta para o seu projeto.</h4><p className={styles.commercialNote}>Valores e condições são definidos com o comercial, conforme o escopo.</p></div>
        <div className={styles.serviceAction}>
          <a href={commercialHref('Olá! Tenho interesse no Desenvolvimento NexOS. Quero conversar sobre o objetivo do meu projeto, escopo, prazos e condições de contratação.')} target="_blank" rel="noopener noreferrer" className={`${styles.buyButton} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">{service.ctaText}<ArrowUpRight size={16} aria-hidden="true" /></span></a>
          <p className={styles.hint}>Conte sua ideia ao comercial. Alinhamos escopo, prazo e condições antes de fechar.</p>
        </div>
      </div>
    </motion.article>
  );
}

const DIFFERENTIALS = [
  { icon: Layers, title: 'Do primeiro esboço à entrega', description: 'Estrutura, design e desenvolvimento pensados juntos.' },
  { icon: Headphones, title: 'Conversa direta', description: 'Fale com quem está construindo o seu projeto.' },
  { icon: MessageSquare, title: 'Uma proposta com contexto', description: 'Objetivos, funcionalidades e condições alinhados com seu momento.' },
];

export function Services({ className = '' }: { className?: string }) {
  const [goal, setGoal] = useState<ServiceGoal>('all');
  const visibleServices = config.services.filter(service => service.id === 'dev');
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
            <p className={styles.lead}>Apresente seu trabalho, organize seu atendimento ou dê um destino às suas campanhas. A NexOS reúne conteúdo, design e desenvolvimento em uma solução feita para o seu negócio.</p>
          </header>
          <ServiceExplorer value={goal} onChange={setGoal} />
          <p className={styles.resultCount} aria-live="polite">{visibleServices.length} {visibleServices.length === 1 ? 'solução disponível' : 'soluções disponíveis'}{goal !== 'all' ? ' para seu objetivo' : ''}</p>
          <div className={styles.servicesGrid} data-single={visibleServices.length === 1}>
            {visibleServices.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
          <div className={styles.differentials}>{DIFFERENTIALS.map(({ icon: Icon, title, description }) => <div key={title}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>)}</div>
        </div>
      </section>
    </>
  );
}
