'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './warp-carousel.module.css';

/* Warp Carousel — the ring geometry and the lens flare by Louis Studios, adapted
   to the ezway stage. The reference paints stat cards into a canvas and spins
   them on a timer; here the ring carries the real MacBook mockups, so the timer
   and the drag gestures are left out and the scroll drives the ring instead. */

/** Stage units: a card is 256 units wide; the stage width comes from CSS. */
const CARD_WIDTH = 256;

/** The ring fit, measured from the reference. */
const G = {
  qA: 0.46401,
  XLA: 165.774,
  zA: 35.354,
  psiA: 1.44638,
  a1: 1.31454,
  a2: 1.10948,
  qB: 0.74999,
  XB: 204.525,
  ZB: 355.405,
  bB: 0.69311,
  bE: 0.04614,
  vC: 203.134,
  aC: 229.260,
  kB: 0.01087,
  bP: 0.99129,
  qPR: 1.01828,
  bPL: 1.00920,
  qPL: 1.07139,
};

/** Depth and yaw follow the reference; horizontal spacing follows the real devices. */
const TUNING = { z: 0.34, yaw: 0.56, yawMax: 42 };

type Pose = [number, number, number];

/** Pose of a card at ring offset q (0 front, +1 right, -1 left): centre x, depth behind the front plane, yaw. */
function poseAt(q0: number): Pose {
  let q = q0;
  if (Math.abs(q) < 1) q -= G.kB * Math.sin(Math.PI * q) ** 2;
  const s = q < 0 ? -1 : 1;
  const a = Math.abs(q);
  const half = CARD_WIDTH / 2;
  if (a <= G.qA) {
    const t = a / G.qA;
    const xl = -half + (G.XLA + half) * Math.pow(t, G.a1);
    const zl = G.zA * t ** 4;
    const psi = G.psiA * Math.pow(t, G.a2);
    return [s * (xl + half * Math.cos(psi)), zl + half * Math.sin(psi), s * psi];
  }
  const dXL = ((G.XLA + half) * G.a1) / G.qA;
  const dZL = (G.zA * 4) / G.qA;
  const dps = (G.psiA * G.a2) / G.qA;
  let Hx: number;
  let Hz: number;
  if (a <= G.qB) {
    const L = G.qB - G.qA;
    const t = (a - G.qA) / L;
    const hx = G.XLA + CARD_WIDTH * Math.cos(G.psiA);
    const hz = G.zA + CARD_WIDTH * Math.sin(G.psiA);
    const dhx = dXL - CARD_WIDTH * Math.sin(G.psiA) * dps;
    const dhz = dZL + CARD_WIDTH * Math.cos(G.psiA) * dps;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    Hx = h00 * hx + h10 * L * dhx * G.bB + h01 * G.XB + h11 * L * G.vC * G.bE;
    Hz = h00 * hz + h10 * L * dhz * G.bB + h01 * G.ZB;
  } else {
    const d = a - G.qB;
    Hx = G.XB + G.vC * d + G.aC * d * d;
    Hz = G.ZB;
  }
  const qP = s < 0 ? G.qPL : G.qPR;
  const bP = s < 0 ? G.bPL : G.bP;
  const LP = qP - G.qA;
  const tp = Math.min(1, (a - G.qA) / LP);
  const psi = (2 * tp ** 3 - 3 * tp ** 2 + 1) * G.psiA + (tp ** 3 - 2 * tp ** 2 + tp) * LP * dps * bP + (-2 * tp ** 3 + 3 * tp ** 2) * Math.PI;
  return [s * (Hx - half * Math.cos(psi)), Hz - half * Math.sin(psi), s * psi];
}

export interface WarpCarouselHandle {
  /** Places the ring at a continuous position; fractional values sit between cards. */
  paint: (progress: number) => void;
}

/**
 * A ring of DOM cards on the Warp Carousel geometry. The parent owns the
 * scroll: it calls `paint` from its own loop, so the ring is reversible and
 * never listens to the wheel or to touch.
 */
export function WarpCarousel({
  cards = [],
  children,
  className = '',
  style,
  ariaLabel,
  ringRef,
}: {
  /** The cards that sit on the ring. */
  cards?: ReactNode[];
  /** Content laid over the stage, such as a title and a caption. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  ringRef?: React.Ref<WarpCarouselHandle>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringElRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const paint = useCallback((progress: number) => {
    progressRef.current = progress;
    const root = rootRef.current;
    const ring = ringElRef.current;
    if (!root || !ring) return;
    const stage = parseFloat(getComputedStyle(root).getPropertyValue('--warp-stage')) || 720;
    const unit = (root.clientWidth || stage) / stage;
    const cards = Array.from(ring.querySelectorAll<HTMLElement>('[data-warp-card]'));
    const count = cards.length;
    if (!count) return;
    cards.forEach((card, index) => {
      // The ring wraps, so a card never drifts past the front.
      const raw = index - progress;
      const offset = ((raw + count / 2) % count + count) % count - count / 2;
      const [, z, psi] = poseAt(offset);
      // The reference ring uses 256-unit cards. A MacBook is much wider: spacing
      // by its measured width prevents neighbors from covering the active screen.
      // Adjacent cards stay large enough to show their screens, while their
      // centers remain far enough apart even halfway between two examples.
      const cardWidth = card.offsetWidth;
      const scale = 1 - 0.22 * Math.min(Math.abs(offset), 1.5);
      // Narrow stages crop the outer edge, so use a tighter orbit there.
      const x = offset * (cardWidth * (root.clientWidth < 768 ? 0.72 : 0.94) + (root.clientWidth < 768 ? 36 : 40));
      const y = Math.min(Math.abs(offset), 1) * 24;
      const yaw = Math.max(-TUNING.yawMax, Math.min(TUNING.yawMax, ((psi * 180) / Math.PI) * TUNING.yaw));
      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${(-z * unit * TUNING.z).toFixed(2)}px) rotateY(${yaw.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = String(Math.max(0, 1 - Math.abs(offset) / 2.7));
      card.style.zIndex = String(20 - Math.round(Math.abs(offset) * 4));
      card.dataset.active = String(Math.abs(offset) < 0.5);
    });
  }, []);

  useImperativeHandle(ringRef, () => ({ paint }), [paint]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const stage = parseFloat(getComputedStyle(root).getPropertyValue('--warp-stage')) || 720;
      root.style.setProperty('--warp-unit', `${(root.clientWidth || stage) / stage}px`);
      paint(progressRef.current);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [paint]);

  return <div ref={rootRef} className={`${styles.surface} ${className}`} style={style}>
    <div ref={ringElRef} className={styles.ring} role="group" aria-label={ariaLabel} data-warp-ring>
      {cards}
    </div>
    <div className={styles.lens} aria-hidden="true" />
    <div className={styles.bands} aria-hidden="true" />
    {children}
  </div>;
}

export default WarpCarousel;
