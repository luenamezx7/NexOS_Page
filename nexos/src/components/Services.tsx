'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Code2, Nfc } from 'lucide-react';
import { config } from '@/config';
import { ScrollReveal } from './ScrollReveal';
import { HighlightedText } from './highlighted-text';
import tiger from '../../design-/VIDEOS-IA/tiger-pic-2k-purp.jpg';
import styles from './DigitalSolutions.module.css';
import { useLocale } from '@/lib/locale';

const MENU = {
  'Cafés': ['Espresso', 'Cappuccino', 'Café coado'],
  'Pratos': ['Salada da casa', 'Massa artesanal', 'Prato do dia'],
};

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const [category, setCategory] = useState<keyof typeof MENU>('Cafés');
  const service = config.services.find(item => item.id === 'dev');
  return <section id="services" aria-labelledby="services-title" className={`${styles.section} ${className}`}>
    <div className={styles.container}>
       <header className={styles.header}>
          <ScrollReveal as="p" preset="label" className={styles.bridge}>{t('Depois da placa')}</ScrollReveal>
          <ScrollReveal as="h2" preset="title" id="services-title">{t('O que seu cliente encontra')} <HighlightedText inView from="left" delay={.1}>{t('depois da placa?')}</HighlightedText></ScrollReveal>
           <ScrollReveal as="p">{t('Você pode usar um endereço que já tem. Se precisar criar um, fazemos um cardápio para consultar no celular ou um site para conhecer seus serviços e entrar em contato.')}</ScrollReveal>
           {selectedUse && <p className={styles.selectedPath}>{t('Você escolheu:')} <strong>{t(selectedUse)}</strong>. {t('Agora veja o que pode aparecer na tela do seu cliente.')}</p>}
       </header>
       <div className={styles.previews}>
             <ScrollReveal as="article" className={styles.menu} data-relevant={selectedUse === 'Cardápio digital'}>
               <div className={styles.menuCopy}><span className={styles.journeyCue}><Nfc size={16} aria-hidden="true" /> {t('Da placa à mesa')}</span><h3>{t('Cardápios Digitais')}</h3><p>{t('O cliente abre o cardápio no celular, escolhe uma categoria e consulta pratos e preços sem esperar um cardápio impresso.')}</p><Link href="/cardapio-digital">{t('Conhecer o cardápio digital')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
                <div className={styles.menuPreview} data-journey-visual><span>{t('À mesa')}</span><p>{t('O que vai')}<br />{t('bem hoje?')}</p><div className={styles.categories} role="group" aria-label={t('Categorias do cardápio')}>{(Object.keys(MENU) as Array<keyof typeof MENU>).map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{t(item)}</button>)}</div><ul aria-live="polite">{MENU[category].map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{t(item)}</li>)}</ul></div>
           </ScrollReveal>
          <ScrollReveal as="article" className={styles.website} data-relevant={selectedUse === 'Instagram' || selectedUse === 'Google'}>
            <div className={styles.demoLabel}><Code2 size={14} aria-hidden="true" /> {t('Da placa à sua presença digital')}</div>
          <div className={styles.sitePreview}>
             <div className={styles.previewNav}><span>ezway</span><span>{t('Sites e Portfólios')}</span></div>
              <Image src={tiger} alt={t('Arte original da ezway em uma composição de site')} width={640} height={460} sizes="(max-width: 767px) 90vw, 50vw" className={styles.siteImage} />
            <p>Uma presença<br />que é só sua.</p>
          </div>
             <div className={styles.serviceCaption}><div><h3>{t('Sites e Portfólios')}</h3><p>{t('Seu cliente abre o site para ver o que você faz, conhecer seus projetos e encontrar um jeito de falar com você.')}</p></div><Link href="/criacao-de-sites" className={styles.captionLink}>{t('Conhecer sites e portfólios')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
         </ScrollReveal>
       </div>
         <div className={styles.commercial}><div><h3>{t(service?.title || 'Desenvolvimento ezway')}</h3><p>{t('Já tem um site, cardápio ou WhatsApp? Podemos usar esse endereço na placa. Se ainda precisa de um cardápio ou site, criamos essa parte com você.')}</p><p>{t('Organizamos as informações para que seu cliente encontre o que procura e saiba como falar com seu negócio.')}</p><p>{t('A placa e os serviços digitais podem ser contratados separadamente. Escopo, valores e condições são alinhados com o comercial.')}</p></div></div>
    </div>
  </section>;
}
