'use client';

import { useState } from 'react';
import { TiltedGridHero } from '../ui/tilted-grid-hero';
import { ScrollReveal } from '../ScrollReveal';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

export function MascotSolutions() {
  const { t } = useLocale();
  const [paused, setPaused] = useState(false);
  const items = [
    { id: 'plate', title: t('Placa NFC'), description: t('Seu cliente aproxima o celular e encontra o destino que você escolheu.'), image: '/nfcs/nfccardapio.svg', alt: t('Modelo ilustrativo de placa NFC ezway') },
    { id: 'site', title: t('Site e portfólio'), description: t('Mostre projetos, serviços e formas de contato num só lugar.'), image: '/ezway-demo-studio.jpg', alt: t('Espaço de trabalho ilustrativo do portfólio') },
    { id: 'menu', title: t('Cardápio digital'), description: t('Opções organizadas para consultar no celular.'), image: '/ezway-demo-cafe.jpg', alt: t('Foto ilustrativa de café') },
    { id: 'team', title: t('Atendimento'), description: t('Uma conversa para escolher o que faz sentido para o seu negócio.'), image: '/nfcs/nfcwpp.svg', alt: t('Placa ilustrativa com destino WhatsApp') },
  ];
  return <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}><div className={styles.container}><h2 id="mascot-solutions-title" className="mb-8 text-center text-3xl font-semibold md:text-5xl">{t('Um caminho para cada necessidade.')}</h2><ScrollReveal><p className={styles.intro}>{t('Mostre projetos, serviços e formas de contato num só lugar.')}</p></ScrollReveal>
    <TiltedGridHero images={items.map(item => ({ src: item.image, alt: item.alt }))} paused={paused} className={styles.band} tileHeight={65} aspectRatio={1.45} axis={50} curve={62} fade={14} speed={5} />
    <button type="button" className={styles.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{t(paused ? 'Retomar animação' : 'Pausar animação')}</button>
    <ul className={styles.destinations}>{items.map((item, index) => <li key={item.id}><a href={['/placa-nfc', '/criacao-de-sites', '/cardapio-digital', '/#plate-management'][index]}><strong>{item.title}</strong><span>{item.description}</span></a></li>)}</ul></div></section>;
}

export default MascotSolutions;
