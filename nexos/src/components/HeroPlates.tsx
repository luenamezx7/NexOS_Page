'use client';

import { useLocale } from '@/lib/locale';
import Image from 'next/image';
import styles from './HeroPlates.module.css';
import { useRef, useSyncExternalStore } from 'react';
import { useInView } from 'motion/react';
import { usePresentationActive } from '@/lib/use-presentation-active';

const plates = [
  { src: '/nfcs/nfccardapio.svg', name: 'Cardápio digital', layer: 'menu' },
  { src: '/nfcs/nfcinsta.svg', name: 'Instagram', layer: 'instagram' },
  { src: '/nfcs/nfcwpp.svg', name: 'WhatsApp', layer: 'whatsapp' },
  { src: '/nfcs/nfcgoogle.svg', name: 'Google', layer: 'google' },
];
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};

/** Original catalogue SVGs: keep QR codes intact and their square proportions. */
export function HeroPlates() {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { amount: .01 });
  const presenting = usePresentationActive();
  const foreground = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => false);
  return <figure ref={ref} className={styles.panel} aria-label={t('Catálogo de placas NFC ezway')} data-hero-plates data-motion-active={visible && foreground && !presenting}>
    <div className={styles.plates}>{plates.map(plate => <div className={styles.plate} data-plate={plate.layer} key={plate.src}>
      <Image src={plate.src} alt={`${t('Placa NFC ezway')} · ${t(plate.name)}`} width={1000} height={1000} sizes="(max-width: 767px) 52vw, 320px" />
      <span>{t(plate.name)}</span>
    </div>)}</div>
    <figcaption>NFC + QR Code <span>{t('Uma aproximação. O próximo passo.')}</span></figcaption>
  </figure>;
}
