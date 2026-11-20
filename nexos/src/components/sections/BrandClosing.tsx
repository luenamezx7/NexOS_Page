'use client';

import Image from 'next/image';
import seatedAvatar from '../../../public/images/avatars/Avatar_seated_in_contemplative_pose_2b93f896_2K.png';
import { ScrollReveal } from '../ScrollReveal';
import { BrandWordmark } from '../BrandWordmark';
import styles from './BrandClosing.module.css';
import { useLocale } from '@/lib/locale';

/** A typographic closing scene, inspired by -/ref-name.png in the ezway palette. */
export function BrandClosing() {
  const { t } = useLocale();
  return <section id="brand-closing" className={styles.closing} aria-label={t('ezway — Design, código e conexão')}>
    <div className={styles.closingSurface} data-edge-surface>
      <ScrollReveal as="p" preset="label" className={styles.closingCaption}>{t('Feito pela ezway')}</ScrollReveal>
      <div className={styles.wordmarkCrop}>
        <a href="#hero" className={styles.wordmarkLink} aria-label={t('ezway, início')}>
          <div className={styles.wordmarkFrame}>
            <BrandWordmark as="h2" registered staticHeading className={styles.gradientWordmark} />
          </div>
        </a>
        <Image src={seatedAvatar} alt="" className={styles.closingAvatar}
          sizes="(max-width: 767px) 22vw, (max-width: 1364px) 20vw, 264px" />
      </div>
    </div>
  </section>;
}
