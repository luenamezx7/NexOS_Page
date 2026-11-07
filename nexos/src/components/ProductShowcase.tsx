'use client';

import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ArrowUpRight, Nfc } from 'lucide-react';
import { config } from '@/config';
import { MetallicSurface } from './ui/metallic-button';
import { plateCommercialHref } from '@/lib/commercial';
import { DetailTabs, type DetailTab } from './commerce/DetailTabs';
import { PlateChooser } from './commerce/PlateChooser';
import { HighlightedText } from './highlighted-text';
import { GlowingBadge } from './unlumen-ui/primitives/glowing-badge';
import styles from './commerce/Commerce.module.css';
import { useLocale } from '@/lib/locale';

const DETAILS: DetailTab[] = [
  { id: 'uso', label: 'Como funciona', title: 'Um gesto. Seu negócio conectado.', description: 'Aproxime um celular compatível com NFC ou use a câmera para ler o QR Code. O cliente abre o link que você escolheu.', items: ['NFC e QR Code na mesma placa', 'Acesso ao seu cardápio, portfólio ou redes sociais', 'Uma experiência simples no balcão, na mesa ou na recepção'] },
  { id: 'marca', label: 'Sua marca', title: 'A placa também fala por você.', description: 'Converse com a ezway para definir a identidade da sua placa e o destino do link.', items: ['Nome e identidade do seu negócio', 'Link personalizável', 'Atendimento para alinhar a personalização'] },
  { id: 'lotes', label: 'Para seu espaço', title: 'Um ou vários pontos de contato.', description: 'Conte à equipe onde pretende usar as placas para alinhar personalização, valores e frete.', items: ['Mesas, balcões ou recepções', 'Proposta conforme a necessidade do seu negócio', 'Valores e condições definidos com o comercial'] },
];

export function ProductShowcase({ className = '', onSelectUse }: { className?: string; onSelectUse?: (name: string) => void }) {
  const { t } = useLocale();
  const [selectedUse, setSelectedUse] = useState<string>();
  const placa = config.services.find(service => service.id === 'placa');
  if (!placa) return null;

  return (
      <section id="showcase" aria-labelledby="showcase-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
           <ScrollReveal preset="label" className={styles.sectionNav} aria-label={t('Explore as soluções')}>
             <span className={styles.currentSection}><Nfc size={16} aria-hidden="true" /> {t('Produto físico')}</span>
           </ScrollReveal>
           <div className={styles.productGrid}>
              <div className={styles.productIntro}>
                 <div className={styles.kicker}><GlowingBadge variant="neutral">{t('Placa Inteligente ezway')}</GlowingBadge></div>
                  <ScrollReveal as="h2" preset="title" id="showcase-title" className={styles.heading}>{t('O que seu cliente vai abrir')} <HighlightedText inView from="bottom" delay={.1}>{t('na placa?')}</HighlightedText></ScrollReveal>
                 <ScrollReveal as="p" className={styles.lead} delay={.06}>{t('Escolha o destino: cardápio para consultar à mesa, Instagram para conhecer a marca, WhatsApp para conversar ou Google para encontrar seu endereço.')}</ScrollReveal>
              </div>
              <div className={styles.productVisual}><PlateChooser onSelect={name => { setSelectedUse(name); onSelectUse?.(name); }} /></div>
             <ScrollReveal preset="card" className={styles.purchase}>
              <div className={styles.selectionRow}>
                <div>
                    <h3 className={styles.commercialHeading}>{t('Quer uma placa no seu espaço?')}</h3>
                    <p className={styles.commercialNote}>{t('Conte onde vai usá-la. A equipe combina com você o destino, a personalização, os valores e o frete.')}</p>
                </div>
              </div>
                   <a href={plateCommercialHref(selectedUse)} target="_blank" rel="noopener noreferrer" className={`${styles.buyButton} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">{t('Conversar sobre minha placa')} <ArrowUpRight size={16} aria-hidden="true" /></span></a>
                <p className={styles.hint}>{t('A placa e o destino digital podem ser contratados separadamente.')}</p>
            </ScrollReveal>
          </div>
           <ScrollReveal><DetailTabs id="plate-details" tabs={DETAILS.map(tab => ({ ...tab, label: t(tab.label), title: t(tab.title), description: t(tab.description), items: tab.items.map(t) }))} /></ScrollReveal>
        </div>
      </section>
  );
}

export default ProductShowcase;
