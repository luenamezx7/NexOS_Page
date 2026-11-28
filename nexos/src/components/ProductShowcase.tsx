'use client';

import { useCallback, useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { MetallicSurface } from './ui/metallic-button';
import { plateCommercialHref } from '@/lib/commercial';
import { PlateCarousel } from './commerce/PlateCarousel';
import { BenefitNote, Scribble } from './ui/scribble';
import { Nfc, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { HighlightedText } from './highlighted-text';
import styles from './commerce/Commerce.module.css';
import { useLocale } from '@/lib/locale';

export function ProductShowcase({ className = '', onSelectUse }: { className?: string; onSelectUse?: (name: string) => void }) {
  const { t } = useLocale();
  const [selectedUse, setSelectedUse] = useState<string>('Instagram');
  const handleChange = useCallback((use: string) => { setSelectedUse(use); onSelectUse?.(use); }, [onSelectUse]);
  const placa = config.services.find(service => service.id === 'placa');
  if (!placa) return null;

  return (
      <section id="showcase" aria-labelledby="showcase-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
           <div className={styles.productGrid}>
              <div className={styles.productIntro}>
                  <ScrollReveal as="h2" preset="title" id="showcase-title" className={styles.heading}>{t('O que seu cliente vai abrir')} <HighlightedText inView from="bottom" delay={.1}>{t('na placa?')}</HighlightedText></ScrollReveal>
              </div>
              <div className={styles.productVisual}><PlateCarousel onChange={handleChange} /></div>
              <ul className={styles.advantages}>
                {[[Nfc, 'Aproximou, abriu', 'NFC funciona na maioria dos celulares, sem app.'], [QrCode, 'QR Code junto', 'Quem não tem NFC escaneia com a câmera.'], [RefreshCw, 'Destino que acompanha', 'Mudou o link? Fale com a gente para atualizar.'], [Smartphone, 'Sem bateria, sem pareamento', 'É só colar no balcão, na mesa ou na parede.']].map(([Icon, title, text]) => { const I = Icon as typeof Nfc; return <li key={String(title)}><I size={20} aria-hidden="true" /><strong>{t(String(title))}</strong><span>{t(String(text))}</span></li>; })}
              </ul>
              <BenefitNote>{t('Um toque e seu cliente já está no seu Instagram, no Google ou no WhatsApp,')} <Scribble>{t('sem digitar nada')}</Scribble>.</BenefitNote>
              <p className={styles.plateDisclaimer}>{t('Modelos ilustrativos. QR Codes de exemplo; na sua placa, o destino e a personalização são definidos com você.')}</p>

          </div>
        </div>
             <div className={styles.purchaseBand}>
              <div className={styles.purchaseBandInner}>
              <div className={styles.selectionRow}>
                <div>
                    <h3 data-heading-static className={styles.commercialHeading}>{t('Quer uma placa no seu espaço?')}</h3>
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
