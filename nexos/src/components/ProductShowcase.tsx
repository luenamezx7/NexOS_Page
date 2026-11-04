'use client';

import { useState, useSyncExternalStore } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ArrowUpRight, Minus, Nfc, Plus, QrCode } from 'lucide-react';
import { config } from '@/config';
import { MetallicSurface } from './ui/metallic-button';
import { plateCommercialHref } from '@/lib/commercial';
import { DetailTabs, type DetailTab } from './commerce/DetailTabs';
import { PlateFan } from './commerce/PlateFan';
import styles from './commerce/Commerce.module.css';
import { useLocale } from '@/lib/locale';

const subscribeHydration = () => () => {};
const MAX_PLATE_QUANTITY = 50;

const DETAILS: DetailTab[] = [
  { id: 'uso', label: 'Como funciona', title: 'Um gesto. Seu negócio conectado.', description: 'Aproxime um celular compatível com NFC ou use a câmera para ler o QR Code. O cliente abre o link que você escolheu.', items: ['NFC e QR Code na mesma placa', 'Acesso ao seu cardápio, portfólio ou redes sociais', 'Uma experiência simples no balcão, na mesa ou na recepção'] },
  { id: 'marca', label: 'Sua marca', title: 'A placa também fala por você.', description: 'Converse com a ezway para definir a identidade da sua placa e o destino do link.', items: ['Nome e identidade do seu negócio', 'Link personalizável', 'Atendimento para alinhar a personalização'] },
  { id: 'lotes', label: 'Em quantidade', title: 'Uma unidade ou vários pontos de contato.', description: 'Escolha a quantidade para suas mesas, balcões ou unidades. Envie a seleção ao comercial para alinhar personalização, valores, frete e fechamento.', items: ['Seleção de 1 a 50 unidades', 'Proposta conforme a necessidade do seu negócio', 'Valores e condições definidos com o comercial'] },
];

export function ProductShowcase({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [qty, setQty] = useState(1);
  const placa = config.services.find(service => service.id === 'placa');
  if (!placa) return null;

  return (
      <section id="showcase" aria-labelledby="showcase-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
           <ScrollReveal preset="label" className={styles.sectionNav} aria-label={t('Explore as soluções')}>
            <span className={styles.currentSection}><Nfc size={16} aria-hidden="true" /> Produto físico</span>
          </ScrollReveal>
          <div className={styles.productGrid}>
            <div className={styles.productIntro}>
               <p className={styles.kicker}>{t('Placa Inteligente ezway')}</p>
              <ScrollReveal as="h2" preset="title" id="showcase-title" className={styles.heading}>Seu próximo contato.<br /><span className={styles.accent}>A uma aproximação.</span></ScrollReveal>
              <ScrollReveal as="p" className={styles.lead} delay={.06}>Do balcão para o digital. Sua marca, seu link e duas formas de conectar: NFC e QR Code.</ScrollReveal>
               <ScrollReveal as="p" className={styles.productCopy}>Cardápio, WhatsApp ou portfólio ao alcance de quem já está no seu espaço. O cliente aproxima o celular ou escaneia o código.</ScrollReveal>
               <ScrollReveal as="p" className={styles.productCopy}>Ideal para mesas, balcões e recepções. A identidade da placa é alinhada com você.</ScrollReveal>
            </div>
            <figure className={styles.productVisual}>
              <ScrollReveal preset="image"><PlateFan /></ScrollReveal>
               <figcaption className={styles.photoCaption}><span><Nfc size={16} aria-hidden="true" /> {t('Aproxime')}</span><span><QrCode size={16} aria-hidden="true" /> {t('Ou escaneie')}</span></figcaption>
            </figure>
            <ScrollReveal preset="card" className={styles.purchase}>
              <div className={styles.selectionRow}>
                <div>
                   <h3 className={styles.commercialHeading}>{t('Sua placa começa com uma conversa.')}</h3>
                   <p className={styles.commercialNote}>{t('Valores, personalização e frete são alinhados diretamente com o comercial.')}</p>
                </div>
              </div>
              <div className={styles.selectionRow}>
                 <span className={styles.meta}>{t('Quantidade desejada')}</span>
                 <div className={styles.quantity} role="group" aria-label={t('Quantidade de placas')}>
                   <button type="button" aria-label={t('Diminuir quantidade')} disabled={!hydrated || qty <= 1} onClick={() => setQty(value => Math.max(1, value - 1))}><Minus size={16} aria-hidden="true" /></button>
                   <output aria-live="polite" aria-label={t('Quantidade selecionada')}>{qty}</output>
                   <button type="button" aria-label={t('Aumentar quantidade')} disabled={!hydrated || qty >= MAX_PLATE_QUANTITY} onClick={() => setQty(value => Math.min(MAX_PLATE_QUANTITY, value + 1))}><Plus size={16} aria-hidden="true" /></button>
                </div>
              </div>
                <a href={plateCommercialHref(qty)} target="_blank" rel="noopener noreferrer" className={`${styles.buyButton} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">{t('Personalizar minha placa')} <ArrowUpRight size={16} aria-hidden="true" /></span></a>
               <p className={styles.hint}>{t('Fale com o comercial pelo WhatsApp para confirmar personalização, frete e fechar a venda.')}</p>
            </ScrollReveal>
          </div>
           <ScrollReveal><DetailTabs id="plate-details" tabs={DETAILS.map(tab => ({ ...tab, label: t(tab.label), title: t(tab.title), description: t(tab.description), items: tab.items.map(t) }))} /></ScrollReveal>
        </div>
      </section>
  );
}

export default ProductShowcase;
