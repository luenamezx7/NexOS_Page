'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Code2 } from 'lucide-react';
import { config } from '@/config';
import { commercialHref } from '@/lib/commercial';
import { ScrollReveal } from './ScrollReveal';
import tiger from '../../design-/VIDEOS-IA/tiger-pic-2k-purp.jpg';
import styles from './DigitalSolutions.module.css';
import { useLocale } from '@/lib/locale';

const MENU = {
  'Cafés': ['Espresso', 'Cappuccino', 'Café coado'],
  'Pratos': ['Salada da casa', 'Massa artesanal', 'Prato do dia'],
};

export function Services({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  const [category, setCategory] = useState<keyof typeof MENU>('Cafés');
  const service = config.services.find(item => item.id === 'dev');
  return <section id="services" aria-labelledby="services-title" className={`${styles.section} ${className}`}>
    <div className={styles.container}>
      <header className={styles.header}><ScrollReveal as="h2" preset="title" id="services-title">Soluções para o seu negócio.</ScrollReveal><ScrollReveal as="p">Sites, landing pages e cardápios digitais. Design e código trabalhando juntos para apresentar o que torna sua marca única.</ScrollReveal></header>
      <div className={styles.previews}>
        <ScrollReveal as="article" className={styles.website}>
          <div className={styles.demoLabel}><Code2 size={14} aria-hidden="true" /> Exemplo de site</div>
          <div className={styles.sitePreview}>
            <div className={styles.previewNav}><span>ezway</span><span>Site demonstrativo</span></div>
             <Image src={tiger} alt={t('Arte original da ezway em uma composição demonstrativa de site')} width={640} height={460} sizes="(max-width: 767px) 90vw, 50vw" className={styles.siteImage} />
            <p>Uma presença<br />que é só sua.</p>
          </div>
           <div className={styles.serviceCaption}><div><h3>Sites e Portfólios</h3><p>Sua história, seus projetos e o próximo contato em um só lugar.</p></div><Link href="/criacao-de-sites" aria-label={t('Conhecer Sites e Portfólios')}><ArrowUpRight /></Link></div>
        </ScrollReveal>
          <ScrollReveal as="article" className={styles.landing}>
            <div className={styles.demoLabel}>Exemplo de landing page</div>
            <div className={styles.landingPreview}><span>Para sua campanha</span><p>Do interesse<br />à próxima ação.</p><Link href="/landing-pages">Conheça o formato <ArrowRight size={16} aria-hidden="true" /></Link></div>
             <div className={styles.serviceCaption}><div><h3>Landing Pages</h3><p>Conteúdo e navegação orientados ao objetivo da sua campanha.</p></div><Link href="/landing-pages" aria-label={t('Conhecer Landing Pages')}><ArrowUpRight /></Link></div>
          </ScrollReveal>
          <ScrollReveal as="article" className={styles.menu}>
            <div className={styles.menuCopy}><h3>Cardápios Digitais</h3><p>Uma escolha mais simples, na tela que seu cliente já tem.</p><Link href="/cardapio-digital">Conhecer o formato <ArrowUpRight size={16} aria-hidden="true" /></Link><small>Exemplo interativo.<br />Itens ilustrativos.</small></div>
             <div className={styles.menuPreview}><span>{t('À mesa')}</span><p>{t('O que vai')}<br />{t('bem hoje?')}</p><div className={styles.categories} role="group" aria-label={t('Categoria do cardápio demonstrativo')}>{(Object.keys(MENU) as Array<keyof typeof MENU>).map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{t(item)}</button>)}</div><ul aria-live="polite">{MENU[category].map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{t(item)}</li>)}</ul></div>
          </ScrollReveal>
      </div>
       <div className={styles.commercial}><div><h3>{t(service?.title || 'Desenvolvimento ezway')}</h3><p>{t('Valores e condições são definidos com o comercial, conforme o escopo. Conversa direta, da primeira ideia à publicação.')}</p></div><a className="btn-primary-nex" href={commercialHref('Olá! Tenho interesse no Desenvolvimento ezway. Quero conversar sobre o objetivo do meu projeto, escopo, prazos e condições de contratação.')} target="_blank" rel="noopener noreferrer">{t('Falar com o comercial')} <ArrowUpRight size={17} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
