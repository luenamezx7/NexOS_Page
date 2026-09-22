'use client';

import { ReactNode } from 'react';

// ============================================================
// NexOS — iPhone Flat Mockup (Figma: figma.json local)
// File: "iPhone 17 Pro Flat Mockups (Community)"
// Modelos extraídos de figma.json (document.children):
// - iPhone 17 Pro  (846:291) + Screen / 17 Pro (851:876) → 402x874 screen, 430x932 frame
// - iPhone 17 Pro Max (846:290) + Screen / 17 Pro Max (846:363)
// - iPhone 16 Pro / 15 / 14 / 13 também disponíveis no arquivo
// Rate limit 429 ontem em figma2.json / figma_mac.json → usando cache local figma.json
// ============================================================

type IPhoneModel = '17pro' | '17proMax' | '16pro' | '15pro' | '14pro';

interface Spec {
  label: string;
  frameW: number; // px at 1x Figma
  frameH: number;
  screenW: number;
  screenH: number;
  radius: number; // frame outer radius
  screenRadius: number;
  islandW: number;
  islandH: number;
}

const SPECS: Record<IPhoneModel, Spec> = {
  '17pro':     { label: 'iPhone 17 Pro',     frameW: 430, frameH: 932, screenW: 402, screenH: 874, radius: 62, screenRadius: 54, islandW: 94, islandH: 30 },
  '17proMax':  { label: 'iPhone 17 Pro Max', frameW: 460, frameH: 996, screenW: 430, screenH: 932, radius: 66, screenRadius: 58, islandW: 100, islandH: 31 },
  '16pro':     { label: 'iPhone 16 Pro',     frameW: 430, frameH: 932, screenW: 402, screenH: 874, radius: 62, screenRadius: 54, islandW: 94, islandH: 30 },
  '15pro':     { label: 'iPhone 15 Pro',     frameW: 430, frameH: 932, screenW: 402, screenH: 874, radius: 62, screenRadius: 54, islandW: 94, islandH: 30 },
  '14pro':     { label: 'iPhone 14 Pro',     frameW: 430, frameH: 932, screenW: 402, screenH: 874, radius: 62, screenRadius: 54, islandW: 94, islandH: 30 },
};

interface IPhoneMockupProps {
  model?: IPhoneModel;
  children?: ReactNode; // conteúdo dentro da tela (ex: screenshot do site)
  wallpaperSrc?: string; // fallback se não houver children
  wallpaperAlt?: string;
  withGloss?: boolean;
  className?: string;
  scale?: number; // 0.5..1.2 escala visual
  showLabel?: boolean;
}

export function IPhoneMockup({
  model = '17pro',
  children,
  wallpaperSrc,
  wallpaperAlt = 'Wallpaper',
  withGloss = true,
  className = '',
  scale = 1,
  showLabel = false,
}: IPhoneMockupProps) {
  const s = SPECS[model];

  // Proporção para render responsivo: usamos width fixo + aspect
  const w = 280 * scale; // base width em px (ajustável via scale)
  const h = (w * s.frameH) / s.frameW;

  // derivados em % para manter fidelidade Figma
  const screenInsetX = ((s.frameW - s.screenW) / 2 / s.frameW) * 100;
  const screenInsetTop = ((s.frameH - s.screenH) / 2 / s.frameH) * 100 * 0.38; // status bar offset ~14px
  const screenInsetBottom = ((s.frameH - s.screenH) / 2 / s.frameH) * 100 * 1.62;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: w, height: h }}
      aria-label={s.label}
      role="img"
    >
      {/* Sombra / glow atrás — igual ao Cover do Figma (gradiente) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[3.2rem] bg-gradient-to-br from-[#ff5c8a]/20 via-[#83358F]/20 to-[#ff5c8a]/15 blur-[28px]"
        style={{ borderRadius: s.radius * (w / s.frameW) }}
      />

      {/* Frame externo — titanium flat (cor do Figma: #1A1A1E com borda #2A2A2E) */}
      <div
        className="absolute inset-0 overflow-hidden border bg-[#0f0f12] shadow-[0_22px_70px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)_inset,0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        style={{
          borderRadius: s.radius * (w / s.frameW),
          borderColor: 'rgba(255,255,255,0.10)',
          borderWidth: 1,
          padding: 10 * (w / 430), // bezel fiel: ~14px Figma → 10px aqui p/ 280w
        }}
      >
        {/* Botões laterais (flat mockup dettaglio) */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-[18%] h-[7%] w-[3px] -translate-x-[1px] rounded-r-md bg-[#2a2a2e] shadow-sm"
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-[26%] h-[12%] w-[3px] -translate-x-[1px] rounded-r-md bg-[#2a2a2e]"
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-[39%] h-[12%] w-[3px] -translate-x-[1px] rounded-r-md bg-[#2a2a2e]"
        />
        <span
          aria-hidden="true"
          className="absolute right-0 top-[28%] h-[14%] w-[3px] translate-x-[1px] rounded-l-md bg-[#2a2a2e]"
        />

        {/* Tela */}
        <div
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: s.screenRadius * (w / s.frameW) }}
        >
          {/* Wallpaper / children */}
          <div className="absolute inset-0">
            {children ? (
              <div className="h-full w-full overflow-hidden">{children}</div>
            ) : wallpaperSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wallpaperSrc}
                alt={wallpaperAlt}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#83358F] via-[#7c3aed] to-[#ff5c8a]" />
            )}
          </div>

          {/* Status Bar (Figma: Status Bar / 16 Pro 125:193) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[28px] items-center justify-between px-6 pt-1">
            <span className="font-mono text-[11px] font-semibold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">9:41</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-[2px] border border-white/35 bg-transparent">
                <span className="block h-full w-[68%] rounded-[1px] bg-white" />
              </span>
              <span className="h-2.5 w-3.5 rounded-sm border border-white/35" />
            </span>
          </div>

          {/* Dynamic Island (Figma island 94x30) */}
          <div
            className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-black shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
            style={{
              width: s.islandW * (w / s.frameW),
              height: s.islandH * (w / s.frameW),
            }}
          />

          {/* Home Indicator (Figma 2:235 → 152x5 centered bottom) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center">
            <span className="h-[5px] w-[38%] max-w-[152px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Gloss */}
          {withGloss && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/[0.06] via-transparent to-white/[0.07]"
            />
          )}
        </div>
      </div>

      {showLabel && (
        <p className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
          {s.label} · Flat Mockup
        </p>
      )}
    </div>
  );
}

// Helper para mostrar MacBook + iPhone lado a lado (como no ProductShowcase)
export function IPhoneMockupRow({
  children,
  model = '17pro',
}: {
  children?: ReactNode;
  model?: IPhoneModel;
}) {
  return (
    <div className="flex items-end justify-center gap-6">
      <IPhoneMockup model={model}>{children}</IPhoneMockup>
      <IPhoneMockup model="17proMax" scale={0.92}>
        {children}
      </IPhoneMockup>
    </div>
  );
}

export default IPhoneMockup;
