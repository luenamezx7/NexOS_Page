'use client';

import { useLocale } from '@/lib/locale';
import Image from 'next/image';
import styles from './HeroPlates.module.css';

const plates = [
  { src: '/nfcs/nfccardapio.svg', name: 'Cardápio digital' },
  { src: '/nfcs/nfcinsta.svg', name: 'Instagram' },
  { src: '/nfcs/nfcwpp.svg', name: 'WhatsApp' },
  { src: '/nfcs/nfcgoogle.svg', name: 'Google' },
];

/** Original catalogue SVGs: keep QR codes intact and their square proportions. */
export function HeroPlates() {
  const { t } = useLocale();
  return <figure className={styles.panel} aria-label={t('Catálogo de placas NFC ezway')} data-hero-plates>
    <div className={styles.orbits} aria-hidden="true" />
    <div className={styles.plates}>{plates.map(plate => <div className={styles.plate} key={plate.src}>
      <Image src={plate.src} alt={`${t('Placa NFC ezway')} · ${t(plate.name)}`} width={1000} height={1000} sizes="(max-width: 767px) 40vw, 240px" />
      <span>{t(plate.name)}</span>
    </div>)}</div>
    <figcaption>NFC + QR Code <span>{t('Uma aproximação. O próximo passo.')}</span></figcaption>
  </figure>;
}
