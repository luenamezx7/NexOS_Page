'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Code2, Nfc } from 'lucide-react';
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
       <header className={styles.header}>
         <ScrollReveal as="p" preset="label" className={styles.bridge}>{t('A conexão começa na placa e continua no seu digital. Podemos criar o cardápio, o site ou a página que seu cliente vai encontrar.')}</ScrollReveal>
         <ScrollReveal as="h2" preset="title" id="services-title">{t('O que seu cliente encontra ao se conectar?')}</ScrollReveal>
         <ScrollReveal as="p">{t('Um cardápio para escolher, um site para conhecer sua marca ou uma página para dar o próximo passo. Criamos o destino digital que faz sentido para o seu negócio.')}</ScrollReveal>
       </header>
       <div className={styles.previews}>
           <ScrollReveal as="article" className={styles.menu}>
             <div className={styles.menuCopy}><span className={styles.journeyCue}><Nfc size={16} aria-hidden="true" /> {t('Da placa à mesa')}</span><h3>{t('Cardápios Digitais')}</h3><p>{t('Da mesa ao seu cardápio. Seu cliente aproxima ou escaneia a placa e consulta pratos e informações no celular.')}</p><Link href="/cardapio-digital">{t('Conhecer o cardápio digital')} <ArrowUpRight size={16} aria-hidden="true" /></Link><small>{t('Exemplo interativo. Itens ilustrativos.')}</small></div>
              <div className={styles.menuPreview}><span>{t('À mesa')}</span><p>{t('O que vai')}<br />{t('bem hoje?')}</p><div className={styles.categories} role="group" aria-label={t('Categoria do cardápio demonstrativo')}>{(Object.keys(MENU) as Array<keyof typeof MENU>).map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{t(item)}</button>)}</div><ul aria-live="polite">{MENU[category].map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{t(item)}</li>)}</ul></div>
           </ScrollReveal>
         <ScrollReveal as="article" className={styles.website}>
           <div className={styles.demoLabel}><Code2 size={14} aria-hidden="true" /> {t('Da placa à sua marca · Exemplo de site')}</div>
          <div className={styles.sitePreview}>
            <div className={styles.previewNav}><span>ezway</span><span>Site demonstrativo</span></div>
             <Image src={tiger} alt={t('Arte original da ezway em uma composição demonstrativa de site')} width={640} height={460} sizes="(max-width: 767px) 90vw, 50vw" className={styles.siteImage} />
            <p>Uma presença<br />que é só sua.</p>
          </div>
            <div className={styles.serviceCaption}><div><h3>{t('Sites e Portfólios')}</h3><p>{t('Do primeiro contato à sua marca. Leve quem está no seu espaço a conhecer seus serviços, projetos e formas de contato.')}</p></div><Link href="/criacao-de-sites" className={styles.captionLink}>{t('Conhecer sites e portfólios')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
         </ScrollReveal>
           <ScrollReveal as="article" className={styles.landing}>
             <div className={styles.demoLabel}>{t('Da placa à próxima ação · Exemplo de landing page')}</div>
             <div className={styles.landingPreview}><span>Para sua campanha</span><p>Do interesse<br />à próxima ação.</p><Link href="/landing-pages">Conheça o formato <ArrowRight size={16} aria-hidden="true" /></Link></div>
              <div className={styles.serviceCaption}><div><h3>{t('Landing Pages')}</h3><p>{t('Da aproximação ao próximo passo. Apresente uma campanha, um serviço ou uma oportunidade em uma página com objetivo claro.')}</p></div><Link href="/landing-pages" className={styles.captionLink}>{t('Conhecer landing pages')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
           </ScrollReveal>
       </div>
        <div className={styles.commercial}><div><h3>{t(service?.title || 'Desenvolvimento ezway')}</h3><p>{t('Já tem um site, cardápio ou canal de contato? Podemos alinhar o uso desse endereço na sua placa. Se precisar criar sua presença digital, a ezway também desenvolve essa etapa.')}</p><p>{t('A placa e os serviços digitais podem ser contratados separadamente. Escopo, valores e condições são alinhados com o comercial.')}</p></div><a className="btn-primary-nex" href={commercialHref('Olá! Tenho interesse no Desenvolvimento ezway. Quero conversar sobre o objetivo do meu projeto, escopo, prazos e condições de contratação.')} target="_blank" rel="noopener noreferrer">{t('Falar com o comercial')} <ArrowUpRight size={17} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
