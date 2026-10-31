'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Code2 } from 'lucide-react';
import { config } from '@/config';
import { commercialHref } from '@/lib/commercial';
import { ScrollReveal } from './ScrollReveal';
import { ServiceExplorer, type ServiceGoal } from './ServiceExplorer';
import tiger from '../../design-/VIDEOS-IA/tiger-pic-2k-purp.jpg';
import styles from './DigitalSolutions.module.css';

const MENU = {
  'Cafés': ['Espresso', 'Cappuccino', 'Café coado'],
  'Pratos': ['Salada da casa', 'Massa artesanal', 'Prato do dia'],
};

export function Services({ className = '' }: { className?: string }) {
  const [goal, setGoal] = useState<ServiceGoal>('all');
  const [category, setCategory] = useState<keyof typeof MENU>('Cafés');
  const service = config.services.find(item => item.id === 'dev');
  return <section id="services" aria-labelledby="services-title" className={`${styles.section} ${className}`}>
    <div className={styles.container}>
      <header className={styles.header}><ScrollReveal as="h2" preset="title" id="services-title">Uma boa ideia.<br /><span>Seu próximo endereço.</span></ScrollReveal><ScrollReveal as="p">Sites, landing pages e cardápios digitais. Design e código trabalhando juntos para apresentar o que torna sua marca única.</ScrollReveal></header>
      <ServiceExplorer value={goal} onChange={setGoal} />
      <p className={styles.count} aria-live="polite">{goal === 'all' ? '3 soluções disponíveis' : goal === 'sell' ? '2 soluções para vender' : '1 solução para apresentar sua marca'}</p>
      <div className={styles.previews} data-filter={goal}>
        {goal !== 'sell' && <ScrollReveal as="article" className={styles.website}>
          <div className={styles.demoLabel}><Code2 size={14} aria-hidden="true" /> Exemplo de site</div>
          <div className={styles.sitePreview}>
            <div className={styles.previewNav}><span>NexOS</span><span>Site demonstrativo</span></div>
            <Image src={tiger} alt="Arte original da NexOS em uma composição demonstrativa de site" width={640} height={460} sizes="(max-width: 767px) 90vw, 50vw" className={styles.siteImage} />
            <p>Uma presença<br />que é só sua.</p>
          </div>
          <div className={styles.serviceCaption}><div><h3>Sites e Portfólios</h3><p>Sua história, seus projetos e o próximo contato em um só lugar.</p></div><Link href="/criacao-de-sites" aria-label="Conhecer Sites e Portfólios"><ArrowUpRight /></Link></div>
        </ScrollReveal>}
        {goal !== 'present' && <>
          <ScrollReveal as="article" className={styles.landing}>
            <div className={styles.demoLabel}>Exemplo de landing page</div>
            <div className={styles.landingPreview}><span>Para sua campanha</span><p>Do interesse<br />à próxima ação.</p><Link href="/landing-pages">Conheça o formato <ArrowRight size={16} aria-hidden="true" /></Link></div>
            <div className={styles.serviceCaption}><div><h3>Landing Pages</h3><p>Conteúdo e navegação orientados ao objetivo da sua campanha.</p></div><Link href="/landing-pages" aria-label="Conhecer Landing Pages"><ArrowUpRight /></Link></div>
          </ScrollReveal>
          <ScrollReveal as="article" className={styles.menu}>
            <div className={styles.menuCopy}><h3>Cardápios Digitais</h3><p>Uma escolha mais simples, na tela que seu cliente já tem.</p><Link href="/cardapio-digital">Conhecer o formato <ArrowUpRight size={16} aria-hidden="true" /></Link><small>Exemplo interativo.<br />Itens ilustrativos.</small></div>
            <div className={styles.menuPreview}><span>À mesa</span><p>O que vai<br />bem hoje?</p><div className={styles.categories} role="group" aria-label="Categoria do cardápio demonstrativo">{(Object.keys(MENU) as Array<keyof typeof MENU>).map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>)}</div><ul aria-live="polite">{MENU[category].map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{item}</li>)}</ul></div>
          </ScrollReveal>
        </>}
      </div>
      <div className={styles.commercial}><div><h3>{service?.title || 'Desenvolvimento NexOS'}</h3><p>Valores e condições são definidos com o comercial, conforme o escopo. Conversa direta, da primeira ideia à publicação.</p></div><a className="btn-primary-nex" href={commercialHref('Olá! Tenho interesse no Desenvolvimento NexOS. Quero conversar sobre o objetivo do meu projeto, escopo, prazos e condições de contratação.')} target="_blank" rel="noopener noreferrer">Falar com o comercial <ArrowUpRight size={17} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
