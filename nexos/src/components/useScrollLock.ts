'use client';

import { useEffect, useRef } from 'react';
import { useScrollContext } from './SmoothScrollProvider';

// ============================================================
// NexOS — useScrollLock(active)
// Trava REAL do scroll da página para modais/drawers.
// Por que só `overflow: hidden` não bastava: o Lenis intercepta
// wheel/touch num raf próprio e continua dirigindo window.scroll
// mesmo com body travado — a página rolava atrás do checkout e o
// scroll do drawer brigava com o da página (scroll chaining/jank).
// Este hook:
//  - chama lenis.stop()/start() via contexto (o Lenis ignora eventos
//    dentro de [data-lenis-prevent], então o container interno do
//    modal continua rolando nativo, inclusive com lenis parado);
//  - mantém overflow:hidden no body/html como trava secundária
//    (teclado, scrollbar drag, ScrollTrigger);
//  - compensa a largura da scrollbar (sem layout shift);
//  - usa contador global: 2 modais sobrepostos não destravam cedo.
// O Lenis adiciona/remove `lenis-stopped` no <html> sozinho.
// ============================================================

let lockCount = 0;
let prevBodyOverflow = '';
let prevBodyPaddingRight = '';
let prevHtmlOverflow = '';

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function applyDomLock(): void {
  if (lockCount > 0) return;
  prevBodyOverflow = document.body.style.overflow;
  prevBodyPaddingRight = document.body.style.paddingRight;
  prevHtmlOverflow = document.documentElement.style.overflow;
  const sw = getScrollbarWidth();
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  if (sw > 0) document.body.style.paddingRight = `${sw}px`;
}

function releaseDomLock(): void {
  if (lockCount > 0) return;
  document.body.style.overflow = prevBodyOverflow;
  document.documentElement.style.overflow = prevHtmlOverflow;
  document.body.style.paddingRight = prevBodyPaddingRight;
}

export function useScrollLock(active: boolean): void {
  const { lenis } = useScrollContext();
  const lockedRef = useRef(false);

  useEffect(() => {
    // Guarda: 1 lock por ciclo ativo (evita contagem dupla se o lenis
    // chegar depois — o effect roda de novo e trava então).
    if (!active || lockedRef.current) return;
    lockedRef.current = true;
    lockCount += 1;
    if (lockCount === 1) applyDomLock();
    // lenis.stop() congela o raf virtual; eventos dentro de
    // [data-lenis-prevent] continuam nativos (ver lenis onVirtualScroll).
    lenis?.stop();
    return () => {
      lockedRef.current = false;
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        releaseDomLock();
        lenis?.start();
        // Recalibra medidas após devolver o overflow (evita salto).
        try {
          (lenis as unknown as { resize?: () => void })?.resize?.();
        } catch {
          /* silencioso */
        }
      }
    };
  }, [active, lenis]);
}
