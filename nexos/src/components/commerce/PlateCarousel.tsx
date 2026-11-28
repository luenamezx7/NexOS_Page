'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationGate } from '@/lib/use-presentation-active';
import styles from './PlateCarousel.module.css';

export const PLATES = [
  { id: 'instagram', file: 'nfc-instagram', name: 'Instagram', use: 'Instagram', caption: 'Seu perfil a um toque.' },
  { id: 'azul', file: 'nfc-azul', name: 'Conecte-se · Azul', use: 'Conecte-se com a gente', caption: 'Todos os seus canais em uma placa.' },
  { id: 'google', file: 'nfc-google', name: 'Avaliações no Google', use: 'Google', caption: 'Mais avaliações, mais confiança.' },
  { id: 'roxo', file: 'nfc-roxo', name: 'Conecte-se · Roxo', use: 'Conecte-se com a gente', caption: 'A identidade da sua marca no balcão.' },
  { id: 'whatsapp', file: 'nfc-whatsapp', name: 'WhatsApp', use: 'WhatsApp', caption: 'Uma conversa a um gesto.' },
  { id: 'laranja', file: 'nfc-laranja', name: 'Conecte-se · Laranja', use: 'Conecte-se com a gente', caption: 'Destaque onde seu cliente olha.' },
] as const;

const AUTOPLAY_MS = 3800;
const MAX_TILT = 16;

/** Shortest signed distance on a ring: -2, -1, 0, 1, 2, 3 for six items. */
function ringOffset(index: number, active: number, length: number) {
  let d = (index - active) % length;
  if (d > length / 2) d -= length;
  if (d < -length / 2) d += length;
  return d;
}

/**
 * Six plates on a soft, looping stage. The plate in focus is larger and owns a
 * pointer-driven 3D tilt with a moving glare: mouse hover on desktop, finger
 * drag on touch screens. Clicking a side plate brings it to focus; the focused
 * plate has no click action.
 */
export function PlateCarousel({ onChange }: { onChange?: (use: string) => void }) {
  const { t } = useLocale();
  const reduced = usePrefersReducedMotion();
  const presenting = usePresentationGate();
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hold, setHold] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);

  const go = useCallback((next: number) => setActive(value => {
    const target = ((next % PLATES.length) + PLATES.length) % PLATES.length;
    return target === value ? value : target;
  }), []);

  useEffect(() => { onChange?.(PLATES[active].use); }, [active, onChange]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || presenting || !inView || hold) return;
    const id = setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, go, hold, inView, presenting, reduced]);

  // Tilt is written straight to CSS variables in one rAF: no React render per move.
  const setTilt = (rx: number, ry: number, gx: number, gy: number, live: boolean) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = tiltRef.current;
      if (!el) return;
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--gx', `${gx.toFixed(1)}%`);
      el.style.setProperty('--gy', `${gy.toFixed(1)}%`);
      el.dataset.live = live ? 'true' : 'false';
    });
  };
  const tiltFrom = (event: ReactPointerEvent<HTMLElement>) => {
    const el = tiltRef.current;
    if (!el || reduced) return;
    const b = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - b.left) / b.width));
    const py = Math.min(1, Math.max(0, (event.clientY - b.top) / b.height));
    setTilt((.5 - py) * MAX_TILT * 2, (px - .5) * MAX_TILT * 2, px * 100, py * 100, true);
  };
  const resetTilt = () => setTilt(0, 0, 50, 30, false);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => { resetTilt(); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag the whole track with mouse or finger; release snaps to the nearest plate.
  const stageRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const gapPx = () => innerWidth < 768 ? innerWidth * .44 : Math.min(240, innerWidth * .34);
  const setDrag = (px: number) => stageRef.current?.style.setProperty('--drag', `${px.toFixed(1)}px`);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    moved.current = false;
    setHold(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) { if (event.pointerType === 'mouse') tiltFrom(event); return; }
    const dx = event.clientX - start.x;
    if (!moved.current && Math.abs(dx) > 6) {
      moved.current = true;
      stageRef.current!.dataset.dragging = 'true';
      // Capture only once a real drag starts, so plain clicks still reach the side plates.
      event.currentTarget.setPointerCapture(event.pointerId);
      resetTilt();
    }
    if (moved.current) setDrag(dx);
  };
  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    if (event.pointerType !== 'mouse') setHold(false);
    if (!start) return;
    const stage = stageRef.current!;
    delete stage.dataset.dragging;
    setDrag(0);
    if (!moved.current || event.type === 'pointercancel') return;
    const dx = event.clientX - start.x;
    const steps = Math.round(-dx / gapPx()) || (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0);
    if (steps) go(active + steps);
  };
  // Side plates focus on click, unless the click ended a drag.
  const focusSide = (index: number) => { if (!moved.current) go(index); };
  const block = (event: { preventDefault: () => void }) => event.preventDefault();

  return <div ref={rootRef} className={styles.root} data-inview={inView || undefined} role="region" aria-roledescription={t('carrossel')} aria-label={t('Modelos de placa NFC')}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHold(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') { setHold(false); resetTilt(); } }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1); }
    }}>
    <div ref={stageRef} className={styles.stage} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onContextMenu={block} onDragStart={block}>
      {PLATES.map((plate, index) => {
        const offset = ringOffset(index, active, PLATES.length);
        const focused = offset === 0;
        return <div key={plate.id} className={styles.slot} data-offset={offset} data-focused={focused || undefined}
          style={{ '--offset': offset, '--abs': Math.abs(offset) } as CSSProperties}
          aria-hidden={!focused}>
          {focused
            ? <div ref={tiltRef} className={styles.tilt} data-live="false">
                <div className={styles.plate}>
                  <Image src={`/placas/${plate.file}.svg`} alt={t(`Placa NFC ${plate.name}`)} fill sizes="(max-width: 767px) 64vw, 360px" unoptimized priority={index === 0} draggable={false} />
                  <span className={styles.glare} aria-hidden="true" />
                </div>
              </div>
            : <button type="button" className={styles.sideButton} tabIndex={-1} onClick={() => focusSide(index)} aria-label={t(plate.name)}>
                <span className={styles.plate}><Image src={`/placas/${plate.file}.svg`} alt="" fill sizes="(max-width: 767px) 40vw, 240px" unoptimized draggable={false} /></span>
              </button>}
        </div>;
      })}
    </div>

    <div className={styles.footer}>
      <button type="button" className={styles.arrow} onClick={() => go(active - 1)} aria-label={t('Placa anterior')}><ArrowLeft aria-hidden="true" /></button>
      <div className={styles.caption} aria-live="polite" aria-atomic="true">
        <strong>{t(PLATES[active].name)}</strong>
        <span>{t(PLATES[active].caption)}</span>
      </div>
      <button type="button" className={styles.arrow} onClick={() => go(active + 1)} aria-label={t('Próxima placa')}><ArrowRight aria-hidden="true" /></button>
    </div>
    <div className={styles.dots} role="group" aria-label={t('Escolher placa')}>
      {PLATES.map((plate, index) => <button key={plate.id} type="button" aria-label={t(plate.name)} aria-pressed={index === active} onClick={() => go(index)} />)}
    </div>
  </div>;
}
