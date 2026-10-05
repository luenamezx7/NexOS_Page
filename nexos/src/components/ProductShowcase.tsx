'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Box, Minus, Nfc, Palette, Plus, QrCode } from 'lucide-react';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkTag, bulkUnitPrice } from '@/lib/bulk-pricing';
import { MetallicSurface } from './ui/metallic-button';
import { checkoutHref } from '@/lib/checkout';
import { DetailTabs, type DetailTab } from './commerce/DetailTabs';
import { PlateQuiz } from './PlateQuiz';
import styles from './commerce/Commerce.module.css';

const PlatePreview = dynamic(() => import('./PlatePreview').then(m => m.PlatePreview), { ssr: false });
const EASE = [0.16, 1, 0.3, 1] as const;
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const personalizeUrl = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent('Olá! Quero personalizar a Placa Inteligente NexOS com a marca do meu negócio.')}`;

const DETAILS: DetailTab[] = [
  { id: 'uso', label: 'Como funciona', title: 'Um gesto. Seu negócio conectado.', description: 'Aproxime um celular compatível com NFC ou use a câmera para ler o QR Code. O cliente abre o link que você escolheu.', items: ['NFC e QR Code na mesma placa', 'Acesso ao seu cardápio, portfólio ou redes sociais', 'Uma experiência simples no balcão, na mesa ou na recepção'] },
  { id: 'marca', label: 'Sua marca', title: 'A placa também fala por você.', description: 'Converse com a NexOS para definir a identidade da sua placa e o destino do link.', items: ['Nome e identidade do seu negócio', 'Link personalizável', 'Atendimento para alinhar a personalização'] },
  { id: 'lotes', label: 'Em quantidade', title: 'Uma unidade ou vários pontos de contato.', description: 'Ajuste a quantidade antes de comprar. Os descontos disponíveis entram automaticamente no total.', items: ['Escolha de 1 a 50 unidades', 'Faixas de desconto a partir de 10 unidades', 'Preço por unidade e total sempre visíveis'] },
];

export function ProductShowcase({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const placa = config.services.find(service => service.id === 'placa');
  if (!placa) return null;
  const unitPrice = bulkUnitPrice(placa.price, qty, placa.id);
  const tag = bulkTag(qty, placa.id);

  return (
    <>
      <section id="showcase" aria-labelledby="showcase-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
          <div className={styles.sectionNav} aria-label="Explore as soluções">
            <span className={styles.currentSection}><Nfc size={16} aria-hidden="true" /> Produto físico</span>
            <a href="#services">Serviços digitais <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <div className={styles.productGrid}>
            <motion.div className={styles.productIntro} initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: EASE }}>
              <p className={styles.kicker}>Placa Inteligente NexOS</p>
              <h2 id="showcase-title" className={styles.heading}>Seu próximo contato.<br /><span className={styles.accent}>A uma aproximação.</span></h2>
              <p className={styles.lead}>Do balcão para o digital. Sua marca, seu link e duas formas de conectar: NFC e QR Code.</p>
              <Link href="/placa-nfc" className={styles.textLink}>Conhecer a placa e suas aplicações <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </motion.div>
            <motion.figure className={styles.productVisual} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE }}>
              <button type="button" className={styles.plateImageButton} onClick={() => setPreviewOpen(true)} aria-label="Explorar placa em preview 3D" aria-haspopup="dialog">
                <Image src="/placas/codex-1.png" alt="Placa Inteligente NexOS de acrílico, com NFC e QR Code, segurada em mãos" fill sizes="(max-width: 899px) 100vw, 50vw" />
                <span className={styles.previewBadge}><Box size={16} strokeWidth={1.75} aria-hidden="true" /> Explorar em 3D <ArrowUpRight size={16} aria-hidden="true" /></span>
              </button>
              <figcaption className={styles.photoCaption}><span><Nfc size={16} aria-hidden="true" /> Aproxime</span><span><QrCode size={16} aria-hidden="true" /> Ou escaneie</span></figcaption>
            </motion.figure>
            <div className={styles.purchase}>
              <div className={styles.priceRow}>
                <div>
                  <span className={styles.meta}>Total para {qty} {qty === 1 ? 'placa' : 'placas'}</span>
                  <p className={styles.price} aria-live="polite" data-testid="plate-total">{money(unitPrice * qty)}</p>
                  <span className={styles.meta}>{money(unitPrice)} por unidade</span>
                </div>
                <div className={styles.quantity} role="group" aria-label="Quantidade de placas">
                  <button type="button" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty(value => Math.max(1, value - 1))}><Minus size={16} aria-hidden="true" /></button>
                  <output aria-live="polite" aria-label="Quantidade selecionada">{qty}</output>
                  <button type="button" aria-label="Aumentar quantidade" disabled={qty >= BULK_MAX_QTY} onClick={() => setQty(value => Math.min(BULK_MAX_QTY, value + 1))}><Plus size={16} aria-hidden="true" /></button>
                </div>
              </div>
              {tag && <p className={styles.discount}>{tag}: desconto aplicado ao total.</p>}
              <Link href={checkoutHref(placa.id, qty)} prefetch={false} className={`${styles.buyButton} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">Comprar placa <ArrowUpRight size={16} aria-hidden="true" /></span></Link>
              <p className={styles.hint}>Revise seu pedido antes de pagar.</p>
              <a href={personalizeUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}><Palette size={16} aria-hidden="true" /> Personalizar minha placa <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <PlateQuiz />
          <DetailTabs id="plate-details" tabs={DETAILS} />
        </div>
      </section>
      {previewOpen && <PlatePreview onClose={() => setPreviewOpen(false)} />}
    </>
  );
}

export default ProductShowcase;
