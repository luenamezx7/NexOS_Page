'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { Minus, Nfc, Palette, Plus } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { BULK_MAX_QTY, bulkTag, bulkUnitPrice } from '@/lib/bulk-pricing';
import { HoldButton } from './HoldButton';
import GradientText from './GradientText';


// Drawer fora do bundle inicial: só baixa quando pede o checkout da placa.
const EmbeddedCheckoutDrawer = dynamic(
  () => import('./EmbeddedCheckout').then((m) => m.EmbeddedCheckoutDrawer),
  { ssr: false },
);

// ============================================================
// NexOS — Product Showcase (sem pin, scroll normal)
// Placa NFC + QR Code em acrílico cristal.
//
// Sem travamento: a página rola direto. Ao entrar na viewport, a
// placa anima uma vez (gira + se aproxima) e o texto sobe em fade.
// GPU only: rotateY / scale / y / opacity.
// ============================================================

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PERSONALIZE_MSG = 'Olá! Vi a Placa Inteligente NexOS e quero personalizar com o nome/logo do meu negócio.';
const personalizeUrl = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(PERSONALIZE_MSG)}`;

/** Hold em verde: preenche só a área do botão (recortado pelo
 *  overflow do .btn-primary-nex) e brilha em verde — sem borda rosada. */
function HoldAffirmFill({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 1], [0, 1]);
  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity }}
      className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600"
    />
  );
}

// O checkout da placa abre só nesta seção (drawer local) — sem card em Serviços.

// QR decorativo determinístico (21x21, com finders nos 3 cantos).
const QR_SIZE = 21;

function isFinder(x: number, y: number): boolean {
  const inCorner = (cx: number, cy: number): boolean =>
    x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
  return inCorner(0, 0) || inCorner(QR_SIZE - 7, 0) || inCorner(0, QR_SIZE - 7);
}

function isFinderSolid(x: number, y: number): boolean {
  const local = (cx: number, cy: number): boolean | null => {
    if (x < cx || x >= cx + 7 || y < cy || y >= cy + 7) return null;
    const lx: number = x - cx;
    const ly: number = y - cy;
    if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return true;
    return lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  };
  return local(0, 0) ?? local(QR_SIZE - 7, 0) ?? local(0, QR_SIZE - 7) ?? false;
}

function pseudoBit(x: number, y: number): boolean {
  let h: number = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) % 100 < 44;
}

function QrMatrix({ dark }: { dark: boolean }) {
  const cells: string[] = [];
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      const filled: boolean = isFinder(x, y) ? isFinderSolid(x, y) : pseudoBit(x, y);
      if (filled) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return (
    <svg
      viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`}
      className="h-full w-full"
      role="img"
      aria-label="QR Code da placa NexOS"
      shapeRendering="crispEdges"
    >
      <rect x={-1} y={-1} width={QR_SIZE + 2} height={QR_SIZE + 2} rx={2} fill={dark ? '#ffffff' : '#0a0a0a'} />
      <path d={cells.join(' ')} fill={dark ? '#0a0a0a' : '#ffffff'} />
    </svg>
  );
}

const PLATE_IMAGE = { src: '/placas/codex-1.png', alt: 'Placa Inteligente NexOS — duas mãos segurando a plaquinha de acrílico cristal com NFC e QR Code' };

function AcrylicPlate() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative w-full flex flex-col items-center">
      <motion.div
        initial={reduce ? { opacity: 0, y: 16 } : { opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative will-change-transform"
      >
        {/* Brilho intenso vindo de trás — gradiente */}
        <motion.div
          aria-hidden="true"
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={reduce ? undefined : { duration: 4.2, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: 'mirror' }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[108%] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-gradient-to-br from-[#ff5c8a]/28 via-[#83358F]/32 to-[#ff5c8a]/22 blur-[36px] will-change-transform"
        />
        <motion.div
          aria-hidden="true"
          animate={reduce ? undefined : { y: [0, -4, 0], scale: [1, 1.03, 1] }}
          transition={reduce ? undefined : { duration: 4.2, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: 'mirror', delay: 0.2 }}
          className="pointer-events-none absolute left-1/2 top-[54%] h-[68%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#83358F]/28 via-[#ff5c8a]/22 to-[#83358F]/20 blur-[42px] will-change-transform"
        />
        <motion.div
          aria-hidden="true"
          animate={reduce ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={reduce ? undefined : { duration: 3.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[42%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ff5c8a]/30 via-[#ff5c8a]/18 to-transparent blur-[22px] will-change-transform"
        />
        {/* MacBook Air 13 — mais distante, flutuando, com brilho gradiente atrás */}
        <motion.div
          animate={reduce ? undefined : { y: [0, -9, 0] }}
          transition={reduce ? undefined : { duration: 4.8, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: 'mirror' }}
          className="relative w-[500px] max-w-[88vw] will-change-transform sm:w-[540px] md:w-[580px]"
        >
          {/* Tela */}
          <div className="relative overflow-hidden rounded-t-[1.15rem] border-[8px] border-[#1e1e1e] border-b-0 bg-[#1e1e1e] p-1.5 pb-0 shadow-[0_22px_70px_rgba(0,0,0,0.24)]">
            <div className="relative overflow-hidden rounded-t-[0.75rem] bg-gradient-to-br from-[#83358F] via-[#7c3aed] to-[#ff5c8a] aspect-[16/10] p-[7px]">
              <div className="relative h-full w-full overflow-hidden rounded-[0.6rem] bg-white shadow-[inset_0_1px_10px_rgba(0,0,0,0.09)]">
                <motion.img
                  src={PLATE_IMAGE.src}
                  alt={PLATE_IMAGE.alt}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 h-full w-full object-cover will-change-transform"
                  draggable={false}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-t-[0.7rem] bg-gradient-to-tr from-white/10 via-transparent to-white/08" />
              <div className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-md bg-[#1e1e1e] shadow-sm" />
            </div>
            {/* Brilho superior da tampa */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/08 to-transparent" />
          </div>
          {/* Dobradiça */}
          <div className="relative mx-auto h-[2px] w-[96%] bg-[#1a1a1a]" />
          {/* Base — wedge Air */}
          <div className="relative mx-auto w-[98%]">
            <div className="relative h-[16px] rounded-b-[0.9rem] bg-gradient-to-b from-[#3a3a3a] via-[#2a2a2a] to-[#1e1e1e] shadow-[0_10px_28px_rgba(0,0,0,0.20)] border-t border-white/08">
              <div className="pointer-events-none absolute inset-x-10 top-[5px] h-px bg-gradient-to-r from-transparent via-white/08 to-transparent" />
              <div className="absolute left-1/2 top-[6px] h-[7px] w-28 -translate-x-1/2 rounded-[3px] bg-[#111111] border border-white/05 shadow-inner" />
            </div>
            <div className="mx-auto h-[5px] w-[84%] rounded-b-[5px] bg-[#141414] blur-[0.5px] opacity-90" />
          </div>
        </motion.div>
      </motion.div>
      <div className="mt-6 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ff5c8a]/10 text-[#ff5c8a] dark:bg-[#ff5c8a]/15">
          <Nfc size={14} strokeWidth={2} />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 dark:text-white/60">NFC · QR</span>
      </div>
    </div>
  );
}

interface ProductShowcaseProps {
  className?: string;
}

export function ProductShowcase({ className = '' }: ProductShowcaseProps) {
  const reduce: boolean = useReducedMotion() ?? false;
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);

  const placa: Service | undefined = config.services.find((s) => s.id === 'placa');

  const [qty, setQty] = useState<number>(1);
  const holdProgress = useMotionValue(0);
  const decQty = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const incQty = useCallback(() => setQty((q) => Math.min(BULK_MAX_QTY, q + 1)), []);

  const basePrice: number = placa?.price ?? 69.9;
  const unitPrice: number = bulkUnitPrice(basePrice, qty, placa?.id);
  const isDiscounted: boolean = unitPrice < basePrice;
  const discountPct: number = isDiscounted ? Math.round((1 - unitPrice / basePrice) * 100) : 0;
  const activeTag: string | null = bulkTag(qty, placa?.id);
  const fmtBRL = (v: number): string =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const qtyLabel: string = `${qty} ${qty === 1 ? 'unidade' : 'unidades'}`;
  const totalLabel: string = fmtBRL(unitPrice * qty);

  const openCheckout = useCallback(() => {
    if (!placa) return;
    setCheckoutOpen(true);
  }, [placa]);

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
  }, []);

  if (reduce) {
    return (
      <>
      <section
        id="showcase"
        aria-labelledby="showcase-title"
        className={`relative w-full max-w-full overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-12 md:px-8 lg:gap-16 md:py-28">
          <div className="flex justify-center">
            <div className="w-[min(92vw,34rem)] md:w-[42rem]">
              <AcrylicPlate />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 text-center md:items-start md:text-left">
            <p className="self-center font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff5c8a] md:self-start">
              Tecnologia física &amp; digital
            </p>
            <h2 id="showcase-title" className="break-words text-ink">
              Placa Inteligente NexOS <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>NFC &amp; QR Code</GradientText>
            </h2>
            <p className="mx-auto max-w-[52ch] break-words text-sm leading-relaxed text-ink/70 md:mx-0">
              Aproximação instantânea. Conecte clientes a <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}><span className="font-semibold">cardápios, redes sociais e pagamentos</span></GradientText> em menos de 1 segundo.
            </p>
            <div className="grid w-full max-w-[36rem] grid-cols-3 gap-2 self-stretch md:self-start" role="list" aria-label="Destaques da placa">
              {[
                { k: '01', t: '< 1s', d: 'Aproximação' },
                { k: '02', t: 'NFC+QR', d: 'Mesma placa' },
                { k: '03', t: '3 dias', d: 'Envio útil' },
              ].map((f) => (
                <div key={f.k} className="rounded-2xl border border-ink/10 bg-[var(--color-card)] px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-ink/30 dark:text-white/30">{f.k}</p>
                  <p className="mt-1 font-display text-sm font-bold tracking-tight text-ink dark:text-white">{f.t}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50 dark:text-white/50">{f.d}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/[0.03] p-1"
                role="group"
                aria-label="Quantidade de placas"
              >
                <button
                  type="button"
                  onClick={decQty}
                  disabled={qty <= 1}
                  aria-label="Diminuir quantidade"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={15} strokeWidth={2.5} aria-hidden="true" />
                </button>
                <span className="min-w-[4.5rem] text-center font-mono text-xs text-ink" aria-live="polite">
                  {qtyLabel}
                </span>
                <button
                  type="button"
                  onClick={incQty}
                  disabled={qty >= BULK_MAX_QTY}
                  aria-label="Aumentar quantidade"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-col items-start gap-1">
                {isDiscounted && (
                  <span className="font-mono text-xs text-ink/35 line-through dark:text-white/35">Sem desconto {fmtBRL(basePrice * qty)}</span>
                )}
                <p className="inline-flex flex-wrap items-center gap-2 font-mono text-sm font-semibold text-ink">
                  {totalLabel}
                  {activeTag && (
                    <span className="rounded-full border border-[#ff5c8a]/40 bg-[#ff5c8a]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff5c8a]">
                      {activeTag} −{discountPct}%
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 self-stretch sm:self-center md:self-start">
              <HoldButton
                label="Adquirir Já"
                ariaLabel="Adquirir já — segure para confirmar"
                hintId="showcase-hold-hint"
                onConfirm={openCheckout}
                progress={holdProgress}
                background={<HoldAffirmFill progress={holdProgress} />}
                affirm
                className="w-full sm:w-auto"
              />
              <p id="showcase-hold-hint" className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35 md:text-left">
                Segure para confirmar
              </p>
              <a
                href={personalizeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Personalizar placa com meu logo — falar no WhatsApp"
                className="btn-secondary-nex w-full sm:w-auto"
              >
                <Palette size={16} strokeWidth={2} aria-hidden="true" />
                <span>Personalizar minha placa</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      {placa && checkoutOpen && (
        <EmbeddedCheckoutDrawer
          open
          onClose={closeCheckout}
          productId={placa.id}
          productTitle={placa.title}
          productPrice={placa.price}
          quantity={qty}
        />
      )}
      </>
    );
  }

  return (
    <>
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className={`relative w-full max-w-full overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
    >
      {/* Sem pin: scroll normal. A placa só anima ao entrar na viewport. */}
      <div className="relative w-full max-w-full">
        <div className="flex w-full max-w-full items-center justify-center">
          <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-16 md:px-8 lg:gap-20 md:py-28">
            {/* MacBook — centralizado, com respiro */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotateY: -90, scale: 0.7 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: FLUID_EASE }}
              style={{ transformPerspective: 1000 }}
              className="flex justify-center will-change-transform md:justify-center md:pr-4"
            >
              <div className="w-[min(96vw,38rem)] sm:w-[min(88vw,36rem)] md:w-[44rem]">
                <AcrylicPlate />
              </div>
            </motion.div>

            {/* Texto — sobe em fade logo em seguida */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: 0.15, ease: FLUID_EASE }}
              className="flex min-w-0 flex-col gap-4 text-center will-change-transform md:items-start md:text-left"
            >
              <p className="inline-flex items-center gap-2 self-center rounded-full border border-[#ff5c8a]/40 bg-[#ff5c8a]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff5c8a] md:self-start">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff5c8a]" aria-hidden="true" />
                Tecnologia física &amp; digital
              </p>
              <h2 id="showcase-title" className="break-words text-ink">
                Placa Inteligente NexOS <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>NFC &amp; QR Code</GradientText>
              </h2>
              <p className="mx-auto max-w-[52ch] break-words text-sm leading-relaxed text-ink/70 sm:text-base md:mx-0 md:text-lg">
                Aproximação instantânea. Conecte clientes a <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}><span className="font-semibold">cardápios, redes sociais e pagamentos</span></GradientText> em menos de 1 segundo.
              </p>
              <div className="grid w-full max-w-[36rem] grid-cols-3 gap-2 self-stretch md:self-start" role="list" aria-label="Destaques da placa">
                {[
                  { k: '01', t: '< 1s', d: 'Aproximação' },
                  { k: '02', t: 'NFC+QR', d: 'Mesma placa' },
                  { k: '03', t: '3 dias', d: 'Envio útil' },
                ].map((f) => (
                <div key={f.k} className="group rounded-2xl border border-ink/10 bg-[var(--color-card)] px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-colors hover:border-[#ff5c8a]/20 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="font-mono text-[10px] tracking-[0.16em] text-ink/30 dark:text-white/30">{f.k}</p>
                    <p className="mt-1 font-display text-base font-black tracking-tighter text-ink dark:text-white sm:text-lg">{f.t}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50 dark:text-white/50">{f.d}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <div
                  className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/[0.03] p-1"
                  role="group"
                  aria-label="Quantidade de placas"
                >
                  <button
                    type="button"
                    onClick={decQty}
                    disabled={qty <= 1}
                    aria-label="Diminuir quantidade"
                    className="grid h-8 w-8 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={15} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <span className="min-w-[4.5rem] text-center font-mono text-xs text-ink" aria-live="polite">
                    {qtyLabel}
                  </span>
                  <button
                    type="button"
                    onClick={incQty}
                    disabled={qty >= BULK_MAX_QTY}
                    aria-label="Aumentar quantidade"
                    className="grid h-8 w-8 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-col items-start gap-1">
                  {isDiscounted && (
                    <span className="font-mono text-xs text-ink/35 line-through dark:text-white/35">Sem desconto {fmtBRL(basePrice * qty)}</span>
                  )}
                  <p className="inline-flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-3xl font-black tracking-tighter leading-none">
                      <GradientText animationSpeed={6} className="!inline-flex !m-0 !p-0 !bg-transparent !backdrop-blur-0" showBorder={false}>{totalLabel}</GradientText>
                    </span>
                    {activeTag && (
                      <span className="rounded-full border border-[#ff5c8a]/50 bg-[#ff5c8a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_12px_rgba(255,92,138,0.5)]">
                        {activeTag} −{discountPct}%
                      </span>
                    )}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">{fmtBRL(unitPrice)} /un.</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 self-stretch sm:self-center md:self-start">
                <HoldButton
                  label="Adquirir Já"
                  ariaLabel="Adquirir já — segure para confirmar"
                  hintId="showcase-hold-hint"
                  onConfirm={openCheckout}
                  progress={holdProgress}
                  background={<HoldAffirmFill progress={holdProgress} />}
                  affirm
                  className="w-full sm:w-auto"
                />
                <p id="showcase-hold-hint" className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35 md:text-left">
                  Segure para confirmar
                </p>
                <a
                  href={personalizeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Personalizar placa com meu logo — falar no WhatsApp"
                  className="btn-secondary-nex w-full sm:w-auto"
                >
                  <Palette size={16} strokeWidth={2} aria-hidden="true" />
                  <span>Personalizar minha placa</span>
                </a>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
                {placa?.title ?? 'Placa Inteligente'} · {fmtBRL(unitPrice)} /un.{' '}
                {isDiscounted ? (
                  <span className="line-through opacity-60">de {fmtBRL(basePrice)}</span>
                ) : (
                  <span>atacado a partir de 10 un.</span>
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
      {placa && checkoutOpen && (
        <EmbeddedCheckoutDrawer
          open
          onClose={closeCheckout}
          productId={placa.id}
          productTitle={placa.title}
          productPrice={placa.price}
          quantity={qty}
        />
      )}
    </>
  );
}

export default ProductShowcase;
