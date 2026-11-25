'use client';

import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { MetallicSurface } from './ui/metallic-button';
import { plateCommercialHref } from '@/lib/commercial';
import { PlateChooser } from './commerce/PlateChooser';
import { HighlightedText } from './highlighted-text';
import styles from './commerce/Commerce.module.css';
import { useLocale } from '@/lib/locale';

export function ProductShowcase({ className = '', onSelectUse }: { className?: string; onSelectUse?: (name: string) => void }) {
  const { t } = useLocale();
  const [selectedUse, setSelectedUse] = useState<string>('Instagram');
  const placa = config.services.find(service => service.id === 'placa');
  if (!placa) return null;

  return (
      <section id="showcase" aria-labelledby="showcase-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
           <div className={styles.productGrid}>
              <div className={styles.productIntro}>
                  <ScrollReveal as="h2" preset="title" id="showcase-title" className={styles.heading}>{t('O que seu cliente vai abrir')} <HighlightedText inView from="bottom" delay={.1}>{t('na placa?')}</HighlightedText></ScrollReveal>
              </div>
              <div className={styles.productVisual}><PlateChooser onSelect={name => { setSelectedUse(name); onSelectUse?.(name); }} /></div>

          </div>
        </div>
             <div className={styles.purchaseBand}>
              <div className={styles.purchaseBandInner}>
              <div className={styles.selectionRow}>
                <div>
                    <h3 className={styles.commercialHeading}>{t('Quer uma placa no seu espaço?')}</h3>
                     <p className={styles.commercialNote}>{t('Conte onde vai usá-la. Definimos com você o link, a personalização e o valor.')}</p>
                </div>
              </div>
                   <a href={plateCommercialHref(selectedUse, t)} target="_blank" rel="noopener noreferrer" className={`${styles.buyButton} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">{t('Conversar sobre minha placa')} <ArrowUpRight size={16} aria-hidden="true" /></span></a>
                <p className={styles.hint}>{t('A placa e o destino digital podem ser contratados separadamente.')}</p>
              </div>
            </div>
      </section>
  );
}

export default ProductShowcase;
