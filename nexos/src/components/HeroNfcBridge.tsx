'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale';
import styles from './HeroNfcBridge.module.css';

/** A flow-based handoff; no pinning or gesture listeners. */
export function HeroNfcBridge() {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <section ref={ref} className={styles.bridge} aria-label={t('Aproximação NFC')} data-nfc-bridge data-visible={visible}>
    <div className={styles.card}>
      <div className={styles.art} aria-hidden="true">
        <div className={styles.waves}>
          <span className={styles.core} />
          <span className={styles.wave} /><span className={styles.wave} /><span className={styles.wave} />
        </div>
      </div>
      <div className={styles.copy}>
        <h2>{t('Uma aproximação. O próximo passo.')}</h2>
        <p>{t('Seu cliente aproxima o celular ou lê o QR Code e encontra o destino que você escolher.')}</p>
      </div>
    </div>
  </section>;
}
