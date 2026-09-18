'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'motion/react';
import { Nfc } from 'lucide-react';
import { config } from '@/config';
import type { Service } from '@/types';
import { HoldButton } from './HoldButton';

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

function AcrylicPlate() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[3/4.2] w-full overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-white/25 via-white/[0.07] to-white/[0.16] shadow-[0_32px_80px_-24px_rgba(255,46,106,0.45),0_18px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      {/* Reflexo de vidro */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent opacity-60" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {/* Borda polida */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />

      <div className="relative flex h-full flex-col items-center px-5 py-5">
        <p className="font-display text-sm font-bold tracking-[0.28em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          NEXOS
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/70">
          Smart Plate · NFC + QR
        </p>

        <div className="mt-4 w-[62%] max-w-[180px] overflow-hidden rounded-lg border border-white/30 bg-white p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
          <QrMatrix dark={false} />
        </div>

        <div className="mt-auto flex flex-col items-center gap-2">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[#ff2e6a]/60 bg-[#ff2e6a]/20 text-[#ff7ba3] shadow-[0_0_24px_rgba(255,46,106,0.65)]">
            <Nfc size={22} strokeWidth={2} aria-hidden="true" />
          </span>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/75">
            Aproxime ou escaneie
          </p>
        </div>
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
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-12 md:px-8">
          <div className="mx-auto w-[min(68vw,19rem)] md:w-[22rem]">
            <AcrylicPlate />
          </div>
          <div className="min-w-0 text-center md:text-left">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff2e6a]">
              Tecnologia física &amp; digital
            </p>
            <h2 id="showcase-title" className="mt-3 break-words text-ink">
              Placa Inteligente NexOS NFC &amp; QR Code
            </h2>
            <p className="mt-4 break-words text-base leading-relaxed text-ink/70">
              Aproximação instantânea. Conecte clientes a cardápios, redes sociais e pagamentos em menos de 1 segundo.
            </p>
            <HoldButton
              label="Garantir Placas em Lote"
              ariaLabel="Garantir placas em lote — segure para confirmar"
              hintId="showcase-hold-hint"
              onConfirm={openCheckout}
              className="mt-6 w-full sm:w-auto"
            />
            <p id="showcase-hold-hint" className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35 md:text-left">
              Segure para confirmar
            </p>
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
          {/* Brilho radial rosado ao fundo da placa */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,46,106,0.2)_0%,transparent_65%)] blur-2xl"
          />
          <div className="grid-pattern-subtle" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-16 sm:gap-10 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12 md:px-8 md:py-24">
            {/* Placa — gira e se aproxima uma vez ao entrar na viewport */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotateY: -90, scale: 0.7 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: FLUID_EASE }}
              style={{ transformPerspective: 1000 }}
              className="relative mx-auto w-[min(62vw,16rem)] will-change-transform sm:w-[min(50vw,18rem)] md:w-[22rem]"
            >
              <div className="w-full">
                <AcrylicPlate />
              </div>
            </motion.div>

            {/* Texto — sobe em fade logo em seguida */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: 0.15, ease: FLUID_EASE }}
              className="min-w-0 text-center will-change-transform md:text-left"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-[#ff2e6a]/40 bg-[#ff2e6a]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff2e6a]">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff2e6a]" aria-hidden="true" />
                Tecnologia física &amp; digital
              </p>
              <h2 id="showcase-title" className="mt-3 break-words text-ink md:mt-4">
                Placa Inteligente NexOS NFC &amp; QR Code
              </h2>
              <p className="mx-auto mt-3 max-w-[52ch] break-words text-sm leading-relaxed text-ink/70 sm:text-base md:mx-0 md:mt-4 md:text-lg">
                Aproximação instantânea. Conecte clientes a cardápios, redes sociais e pagamentos em menos de 1 segundo.
              </p>
              <div className="mt-5 md:mt-6">
                <HoldButton
                  label="Garantir Placas em Lote"
                  ariaLabel="Garantir placas em lote — segure para confirmar"
                  hintId="showcase-hold-hint"
                  onConfirm={openCheckout}
                  className="w-full sm:w-auto"
                />
                <p id="showcase-hold-hint" className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35 md:text-left">
                  Segure para confirmar
                </p>
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35 md:mt-4">
                {config.services.find((s) => s.id === 'placa')?.title ?? 'Placa Inteligente'} · a partir de R${' '}
                {(config.services.find((s) => s.id === 'placa')?.price ?? 69.9).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
        />
      )}
    </>
  );
}

export default ProductShowcase;
