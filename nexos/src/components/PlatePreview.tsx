'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { RotateCcw, Move, X } from 'lucide-react';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { useScrollContext } from './SmoothScrollProvider';
import styles from './commerce/Interactions.module.css';

/** Frontend spatial preview of the product photo, ready for a future 3D model. */
export function PlatePreview({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const horizontalRef = useRef<HTMLInputElement>(null);
  const verticalRef = useRef<HTMLInputElement>(null);
  const zoomRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const reduce = useReducedMotion();
  const { lenis } = useScrollContext();
  const rotateX = useMotionValue(-4), rotateY = useMotionValue(-12), scale = useMotionValue(1);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 25 });
  const springScale = useSpring(scale, { stiffness: 150, damping: 25 });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector('button')?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    const wasStopped = lenis?.isStopped;
    lenis?.stop();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (!wasStopped) lenis?.start();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [lenis]);

  const reset = () => {
    rotateX.set(-4); rotateY.set(-12); scale.set(1);
    if (horizontalRef.current) horizontalRef.current.value = '-12';
    if (verticalRef.current) verticalRef.current.value = '-4';
    if (zoomRef.current) zoomRef.current.value = '1';
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="plate-preview-title" aria-describedby="plate-preview-description" data-lenis-prevent onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => {
      if (e.key !== 'Tab') return;
      const controls = e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]');
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }} onClick={e => {
      if (e.target !== e.currentTarget) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
    }}>
      <header className={styles.dialogHeader}>
        <div><span className={styles.mono}>NexOS / product lab</span><h2 id="plate-preview-title">Explore a placa.</h2></div>
        <button type="button" aria-label="Fechar preview" onClick={onClose} className={styles.close}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className={styles.previewGrid}>
        <div className={styles.previewStage} onPointerDown={e => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, rx: rotateX.get(), ry: rotateY.get() };
        }} onPointerMove={e => {
          if (!drag.current) return;
          const rx = Math.max(-25, Math.min(25, drag.current.rx - (e.clientY - drag.current.y) / 8));
          const ry = Math.max(-35, Math.min(35, drag.current.ry + (e.clientX - drag.current.x) / 8));
          rotateX.set(rx); rotateY.set(ry);
          if (horizontalRef.current) horizontalRef.current.value = String(ry);
          if (verticalRef.current) verticalRef.current.value = String(rx);
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
          <motion.div className={styles.spatialPhoto} style={{ rotateX: reduce ? rotateX : springX, rotateY: reduce ? rotateY : springY, scale: reduce ? scale : springScale }}>
            <Image src="/placas/codex-1.png" alt="Placa Inteligente NexOS com acabamento transparente, NFC e QR Code" fill sizes="(max-width: 767px) 90vw, 65vw" draggable={false} />
          </motion.div>
          <span className={styles.dragHint}><Move size={14} aria-hidden="true" /> Arraste para explorar</span>
        </div>
        <aside className={styles.previewControls}>
          <p id="plate-preview-description">Preview espacial da imagem do produto. Explore ângulos e aproximação nesta demonstração de interface 3D.</p>
          <FieldGroup>
            <Field><FieldLabel htmlFor="plate-horizontal">Rotação horizontal</FieldLabel><input ref={horizontalRef} id="plate-horizontal" type="range" min="-35" max="35" defaultValue="-12" onChange={e => rotateY.set(Number(e.target.value))} /></Field>
            <Field><FieldLabel htmlFor="plate-vertical">Inclinação vertical</FieldLabel><input ref={verticalRef} id="plate-vertical" type="range" min="-25" max="25" defaultValue="-4" onChange={e => rotateX.set(Number(e.target.value))} /></Field>
            <Field><FieldLabel htmlFor="plate-zoom">Aproximação</FieldLabel><input ref={zoomRef} id="plate-zoom" type="range" min="0.8" max="1.2" step="0.01" defaultValue="1" onChange={e => scale.set(Number(e.target.value))} /></Field>
          </FieldGroup>
          <button type="button" onClick={reset} className={styles.reset}><RotateCcw size={16} aria-hidden="true" /> Restaurar vista</button>
          <span className={styles.mono}>NFC + QR Code / sua marca</span>
        </aside>
      </div>
    </dialog>
  );
}
