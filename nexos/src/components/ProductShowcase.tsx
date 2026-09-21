'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
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

const HERO_PLATE_IMAGES = [
  { src: '/placas/codex-1.png', alt: 'Placa NexOS — acrílico cristal' },
  { src: '/placas/codex-2.png', alt: 'Placa NexOS — escala com luvas' },
];

function AcrylicPlate() {
  const reduce = useReducedMotion() ?? false;
  const [idx, setIdx] = useState(0);
  // Design read: premium hardware showcase for SMB, minimalist luxury roso, double-bezel + bento, VARIANCE 7 / MOTION 5
  return (
    <div className="relative w-full">
      {/* Outer shell — Doppelrand */}
      <motion.div
        initial={reduce ? { opacity: 0, y: 16 } : { opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[2rem] border border-ink/10 bg-ink/[0.02] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/30 to-transparent opacity-60 dark:from-white/10" />
        {/* Inner core */}
        <div className="relative rounded-[calc(2rem-8px)] bg-[var(--color-card)] p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_rgba(0,0,0,0.06)] dark:bg-[#0e0e0f] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % HERO_PLATE_IMAGES.length)}
            aria-label="Trocar modelo — clique"
            className="group relative block w-full cursor-pointer overflow-hidden rounded-[18px] bg-[#f7f5f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5c8a] dark:bg-black/20"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={HERO_PLATE_IMAGES[idx].src}
                  src={HERO_PLATE_IMAGES[idx].src}
                  alt={HERO_PLATE_IMAGES[idx].alt}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 h-full w-full object-cover will-change-transform"
                  draggable={false}
                />
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-transparent" />
            </div>
            <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c8a] shadow-[0_0_8px_rgba(255,92,138,0.6)]" /> {idx === 0 ? 'Acrílico' : 'Escala'} · {idx + 1}/2
            </span>
          </button>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ff5c8a]/10 text-[#ff5c8a] dark:bg-[#ff5c8a]/15">
                <Nfc size={14} strokeWidth={2} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 dark:text-white/60">NFC · QR</span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.12em] text-ink/30 dark:text-white/30">Toque para trocar</span>
          </div>
        </div>
      </motion.div>
      {/* Sombra ambiente suave — não preta dura */}
      <div className="pointer-events-none absolute -bottom-3 left-1/2 h-8 w-[74%] -translate-x-1/2 rounded-full bg-black/10 blur-[18px] dark:bg-black/30" aria-hidden="true" />
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
            <div className="w-[min(92vw,28rem)] md:w-[34rem]">
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

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-12 md:px-8 lg:gap-16 md:py-28">
            {/* Placa — gira e se aproxima uma vez ao entrar na viewport */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotateY: -90, scale: 0.7 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: FLUID_EASE }}
              style={{ transformPerspective: 1000 }}
              className="flex justify-center will-change-transform md:justify-center"
            >
              <div className="w-[min(96vw,32rem)] sm:w-[min(84vw,30rem)] md:w-[36rem]">
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
