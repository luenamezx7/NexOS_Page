'use client';

import ScrollableCardStack from '../ui/scrollable-card-stack';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

export function MascotSolutions() {
  const { t } = useLocale();
  const items = [
    { id: 'plate', title: t('Placa NFC'), description: t('Seu cliente aproxima o celular e encontra o destino que você escolheu.'), image: '/nfcs/nfccardapio.svg', alt: t('Modelo ilustrativo de placa NFC ezway') },
    { id: 'site', title: t('Site e portfólio'), description: t('Mostre projetos, serviços e formas de contato num só lugar.'), image: '/ezway-demo-studio.jpg', alt: t('Espaço de trabalho ilustrativo do portfólio') },
    { id: 'menu', title: t('Cardápio digital'), description: t('Opções organizadas para consultar no celular.'), image: '/ezway-demo-cafe.jpg', alt: t('Foto ilustrativa de café') },
    { id: 'team', title: t('Atendimento'), description: t('Uma conversa para escolher o que faz sentido para o seu negócio.'), image: '/nfcs/nfcwpp.svg', alt: t('Placa ilustrativa com destino WhatsApp') },
  ];
  return <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}><div className={styles.container}><h2 id="mascot-solutions-title" className="mb-8 text-center text-3xl font-semibold md:text-5xl">{t('Um caminho para cada necessidade.')}</h2><ScrollableCardStack items={items} /></div></section>;
}

export default MascotSolutions;
