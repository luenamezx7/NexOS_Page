'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// ============================================================
// NexOS — MacBook Air 13 — Figma ORIGINAL
// Fonte: Figma Community "MacBook Air 13 Free Figma Mockups (99% Vector)"
// URL: https://www.figma.com/design/JIvK9di4d5ZMSaA1xGcp2S/...?node-id=4-4
// Arquivo: public/mackbook_1.svg (export direto do Figma, viewBox 2180x1324)
// Screen coords no SVG: x=220 y=69 w=1740 h=1106 (79.8% x 83.5%)
// ============================================================

interface MacBookMockupProps {
  children?: ReactNode;
  wallpaperSrc?: string;
  wallpaperAlt?: string;
  className?: string;
  scale?: number;
  withShadow?: boolean;
}

export function MacBookMockup({
  children,
  wallpaperSrc,
  wallpaperAlt = 'Tela MacBook Air 13',
  className = '',
  scale = 1,
  withShadow = true,
}: MacBookMockupProps) {
  const reduce = useReducedMotion() ?? false;
  const baseW = 640 * scale;

  return (
    <div className={`relative select-none ${className}`} style={{ width: baseW, maxWidth: '92vw' }} role="img" aria-label="MacBook Air 13 — Figma mackbook_1.svg">
      {withShadow && (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[52%] h-[72%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-gradient-to-br from-[#ff5c8a]/18 via-[#83358F]/18 to-[#ff5c8a]/14 blur-[36px]" />
      )}

      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={reduce ? undefined : { duration: 5, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: 'mirror' }}
        className="relative w-full will-change-transform"
      >
        {/* SVG ORIGINAL DO FIGMA */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mackbook_1.svg" alt="MacBook Air 13 Figma" className="relative z-0 block h-auto w-full select-none" draggable={false} width={2180} height={1324} />

        {/* Overlay da tela — preenche 100% do Screen REPLACE, sangra 1.5px sob a borda preta para não deixar fresta roxa/branca */}
        <div
          className="absolute z-10 overflow-hidden bg-black"
          style={{
            left: 'calc(10.0917% - 1.5px)', // 220/2180 - sangria
            top: 'calc(3.474% - 1.5px)', // 46/1324
            width: 'calc(79.8165% + 3px)',
            height: 'calc(85.271% + 3px)', // 1129/1324 + sangria embaixo
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          {children ? (
            <div className="h-full w-full overflow-hidden bg-white">{children}</div>
          ) : wallpaperSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={wallpaperSrc}
              alt={wallpaperAlt}
              className="h-full w-full object-cover object-center"
              draggable={false}
              width={1740}
              height={1106}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#83358F] via-[#7c3aed] to-[#ff5c8a]" />
          )}
          {/* Notch replica por cima da imagem — evita que a imagem cubra o entalhe/câmera */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 bg-black"
            style={{
              width: '13.45%', // 234/1740 do screen
              height: '3.45%', // 38/1129 do screen
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// Variação flat sem animação para uso em grid
export function MacBookMockupFlat(props: MacBookMockupProps) {
  return <MacBookMockup {...props} withShadow={false} />;
}

export default MacBookMockup;
