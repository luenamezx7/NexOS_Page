'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Nfc } from 'lucide-react';
import { config } from '@/config';

// ============================================================
// NexOS — Interactive Product Showcase (3D Scroll Zoom + CTA)
// Placa NFC + QR Code em acrílico cristal.
// Fase 1: aproxima (scale 0.7 -> pico, rotateX 15deg -> 0).
// Fase 2: recua (pico -> 0.95) e revela título/slogan/CTA.
// GPU only: scale / rotateX / opacity. Mobile: pico 1.1.
// ============================================================

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function scrollToServices(): void {
  const el: HTMLElement | null = document.getElementById('services');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.hash = '#services';
  }
}

function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mq: MediaQueryList = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = (): void => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpointPx]);

  return isMobile;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce: boolean = useReducedMotion() ?? false;
  const isMobile: boolean = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const peak: number = isMobile ? 1.1 : 1.3;

  const plateScale = useTransform(scrollYProgress, [0, 0.45, 0.7, 1], [0.7, peak, 0.95, 0.95]);
  const plateRotateX = useTransform(scrollYProgress, [0, 0.45, 0.7, 1], [15, 0, 0, 0]);
  const plateOpacity = useTransform(scrollYProgress, [0, 0.45, 0.7, 1], [0.3, 1, 1, 1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55, 0.75, 1], [0, 0, 1, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.55, 0.75, 1], [60, 60, 0, 0]);

  if (reduce) {
    return (
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
            <button type="button" onClick={scrollToServices} className="btn-primary-glow mt-6 w-full sm:w-auto">
              <span className="relative z-10">Garantir Placas em Lote</span>
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" className="relative z-10" />
              <span className="shimmer-sweep" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className={`relative w-full max-w-full overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
    >
      <div ref={containerRef} className="relative h-[250vh] w-full max-w-full">
        <div className="sticky top-0 flex h-screen h-dvh w-full max-w-full items-center justify-center overflow-hidden">
          {/* Brilho radial rosado ao fundo da placa */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,46,106,0.2)_0%,transparent_65%)] blur-2xl"
          />
          <div className="grid-pattern-subtle" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-4 sm:gap-8 sm:px-6 md:grid-cols-2 md:gap-12 md:px-8">
            {/* Placa 3D — clique leva ao checkout */}
            <motion.button
              type="button"
              onClick={scrollToServices}
              aria-label="Placa Inteligente NexOS — clique para comprar"
              title="Clique para comprar"
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.3, ease: FLUID_EASE }}
              style={{ scale: plateScale, rotateX: plateRotateX, opacity: plateOpacity, transformPerspective: 900 }}
              className="relative mx-auto block w-[min(68vw,19rem)] cursor-pointer touch-target will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2e6a] sm:w-[min(60vw,20rem)] md:w-[22rem]"
            >
              <AcrylicPlate />
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.24em] text-ink/45">
                Clique para comprar
              </span>
            </motion.button>

            {/* Overlay de informações — revelado na Fase 2 */}
            <motion.div
              style={{ opacity: textOpacity, y: textY }}
              className="min-w-0 text-center will-change-transform md:text-left"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-[#ff2e6a]/40 bg-[#ff2e6a]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff2e6a]">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ff2e6a]" aria-hidden="true" />
                Tecnologia física &amp; digital
              </p>
              <h2 id="showcase-title" className="mt-4 break-words text-ink">
                Placa Inteligente NexOS NFC &amp; QR Code
              </h2>
              <p className="mx-auto mt-4 max-w-[52ch] break-words text-sm leading-relaxed text-ink/70 sm:text-base md:mx-0 md:text-lg">
                Aproximação instantânea. Conecte clientes a cardápios, redes sociais e pagamentos em menos de 1 segundo.
              </p>
              <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
                <motion.button
                  type="button"
                  onClick={scrollToServices}
                  aria-label="Garantir placas em lote — ir para serviços"
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.3, ease: FLUID_EASE }}
                  className="btn-primary-glow touch-target w-full sm:w-auto"
                >
                  <span className="relative z-10">Garantir Placas em Lote</span>
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" className="relative z-10" />
                  <span className="shimmer-sweep" aria-hidden="true" />
                </motion.button>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
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
  );
}

export default ProductShowcase;
