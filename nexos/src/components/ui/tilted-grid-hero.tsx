"use client";

import * as React from "react";
import { useInView } from "motion/react";
import { useDocumentVisible } from "@/lib/use-document-visible";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/* ── the curved row ──────────────────────────────────────────────
 * Scroll Tilted Grid turned on its side, with the tilt drawn as a curve.
 * One row of images streams from right to left around the inside of a
 * cylinder. The centre faces you flat, the ends bend toward you so each
 * end image curves along its length, and the ends fade into the page.
 *
 * A CSS box can't bend, so every tile is cut into SLICES vertical strips,
 * each a flat facet of the cylinder showing its share of the image. The
 * strips sit still inside their tile, each turned its own few degrees
 * round the cylinder's axis, and the tile (preserve-3d) is what moves: one
 * rotateY about that same axis carries the whole tile along the arc. A
 * tile is one animation, so its strips can never drift apart or show
 * different images. Only a tile's delay differs, and that sets where on
 * the arc it sits. The band is transform-only on the compositor; the fade
 * is a static mask over it.
 *
 * The only JS is a ResizeObserver that sizes the loop, and a handler that
 * hands a tile its next image each time it wraps, out of sight.
 * ─────────────────────────────────────────────────────────────── */

// Strips per tile. Each is a few degrees of arc, too little to read as a
// facet; fewer starts to show corners along the top and bottom edges. A
// tight curve wraps a tile round a wide arc, so it needs this many.
// Twelve facets on desktop, six on narrow screens; preserve the supplied cylinder geometry.
const DESKTOP_SLICES = 12;

// Camera distance from the screen, as a multiple of the cylinder's radius.
// Just past the axis, so the ends come right up to the lens and swell; much
// further back and the row flattens out however tight the cylinder.
const CAMERA = 1.6;

/**
 * Cylinder radius, as a share of the hero's width, that puts the frame's
 * edge `bend` radians round the arc as seen through the camera:
 * r·sinθ · CAMERA / (CAMERA − 1 + cosθ) = width / 2, solved for r.
 */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

// A tile is never wider than this share of the hero, so a phone still
// shows its neighbours instead of one tile edge to edge.
const MAX_WIDTH = 55;

/**
 * Lays the loop on the cylinder. The radius puts the frame's edge `bend`
 * radians round the arc (see `arc`). Angles come back in degrees: `unit`
 * is the arc one tile-height spans, `limit` how far round a tile's centre
 * can go before the whole tile is off-screen, and `sweep` how far round
 * the loop's ends sit. The loop reaches past `limit`, so a tile only ever
 * wraps out of sight, and is rounded up to a whole number of tiles so the
 * gap never stretches.
 */
function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
) {
  const h = Math.min(
    (tile / 100) * height,
    ((MAX_WIDTH / 100) * width) / aspect,
  );
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0))
    return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Capped so a hero squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(14, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  };
}

export type TiltedGridImage = {
  src: string;
  /** Only used if you drop the decorative treatment; the band is aria-hidden. */
  alt?: string;
};

export type TiltedGridHeroProps = {
  /**
   * Images run along the row in order. A tile takes its next image each
   * time it wraps off-screen, so the whole list plays through however
   * few tiles the frame needs. Short lists simply repeat.
   */
  images: TiltedGridImage[];
  /**
   * Seconds for the row to advance by one tile. Speed is per tile, not per
   * crossing, so a phone and an ultrawide move at the same pace.
   * @default 4
   */
  speed?: number;
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number;
  /**
   * How far the row has bent round by the frame's edge, in degrees. Higher
   * curls the ends harder toward the viewer. Clamped to 5–85.
   * @default 80
   */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number;
  /** Content rendered above the band. */
  children?: React.ReactNode;
  paused?: boolean;
  /** Signed user navigation; one increment advances exactly one tile. */
  manualStep?: number;
  /** Let the row be dragged with mouse or finger (vertical page scroll stays native). @default true */
  draggable?: boolean;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  paused = false,
  manualStep = 0,
  draggable = true,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: "240px", once: true });
  const visible = useInView(ref);
  const documentVisible = useDocumentVisible();
  const reduce = usePrefersReducedMotion();
  const [compact, setCompact] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const running = !paused && !dragging && visible && documentVisible && !reduce;
  const slices = compact ? 6 : DESKTOP_SLICES;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Null until the observer has measured the hero. The band stays hidden
  // until then, so a first paint laid out for the wrong size never shows.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(
    null,
  );

  // The image each tile shows, as a position in the run of images. It
  // only changes when the tile wraps, which is out of sight, so a resize
  // never swaps an image on screen either.
  const [shown, setShown] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCompact(width < 768);
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((prev) =>
        prev?.columns === next.columns &&
        prev.sweep === next.sweep &&
        prev.unit === next.unit
          ? prev
          : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  const { columns, sweep, unit, limit } =
    layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);

  // Every length is a multiple of the tile's height, which follows the
  // hero's height until MAX_WIDTH caps it on narrow screens.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(
      MAX_WIDTH / aspectRatio
    ).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Out to the axis, round it, back in: a box sits on the cylinder at the
  // angle rotateY gives it.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  // Beyond `limit` a tile is wholly off-screen, so it is hidden there. The
  // loop's ends, where it wraps, fall inside that stretch, and so do tiles
  // swinging round behind the camera.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}`;

  const share = aspectRatio / slices;
  const duration = columns * speed;
  const previousStep = React.useRef(manualStep);
  React.useEffect(() => {
    const delta = manualStep - previousStep.current;
    previousStep.current = manualStep;
    if (!delta || !ref.current) return;
    const animations = ref.current.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSAnimation && animation.animationName === orbit);
    const positions = animations.map(animation => ({ animation, from: Number(animation.currentTime ?? 0) }));
    let frame = 0;
    const start = performance.now();
    const paint = (now: number) => {
      const progress = reduce ? 1 : Math.min(1, (now - start) / 350);
      const eased = 1 - (1 - progress) ** 3;
      positions.forEach(({ animation, from }) => {
        const time = from + delta * speed * 1000 * eased;
        animation.currentTime = time < 0 ? time + duration * 1000 : time;
      });
      if (progress < 1) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [manualStep, orbit, speed, duration, reduce]);
  // Drag scrubs every tile's animation clock together: one tile width of
  // pointer travel equals one tile of advance, so the row follows the finger.
  const drag = React.useRef<{ x: number; y: number; id: number; moved: boolean; tileW: number; from: { animation: Animation; time: number }[] } | null>(null);
  const onDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || (event.pointerType === "mouse" && event.button !== 0) || !ref.current) return;
    const animations = ref.current.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation && a.animationName === orbit);
    const tileEl = ref.current.querySelector<HTMLElement>(`.${tile}`);
    drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false, tileW: (tileEl?.offsetWidth ?? 300) * (1 + gap / 100 / aspectRatio), from: animations.map(animation => ({ animation, time: Number(animation.currentTime ?? 0) })) };
  };
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag.current = null; return; }
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const loop = duration * 1000;
    d.from.forEach(({ animation, time }) => {
      let next = (time - (dx / d.tileW) * speed * 1000) % loop;
      if (next < 0) next += loop;
      animation.currentTime = next;
    });
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
  };
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${
    100 - fade
  }%,transparent)`;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
      data-tilted-grid
      data-running={running}
      data-dragging={dragging || undefined}
      onPointerDown={event => { onDown(event); props.onPointerDown?.(event); }}
      onPointerMove={onMove}
      onPointerUp={event => { onUp(); props.onPointerUp?.(event); }}
      onPointerCancel={event => { onUp(); props.onPointerCancel?.(event); }}
      onDragStart={event => event.preventDefault()}
      style={{ containerType: "size", touchAction: draggable ? "pan-y" : undefined, cursor: draggable ? (dragging ? "grabbing" : "grab") : undefined, userSelect: draggable ? "none" : undefined, ...props.style }}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout && near ? 1 : 0,
          // A shared vanishing point on the row's centre line, so the ends
          // grow evenly above and below it as they come toward the viewer.
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {near && Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit and tile 0 furthest
          // back, so this numbers tiles in the order they come on.
          const first = columns - 1 - t;
          const img = images[(shown[t] ?? first) % Math.max(images.length, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                // Tile t starts t tiles along the loop.
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
                animationPlayState: running ? "running" : "paused",
              }}
              onAnimationIteration={(e) => {
                // elapsedTime counts whole loops, missed events included.
                const lap = Math.round(e.elapsedTime / duration);
                setShown((prev) => {
                  const next = lap * columns + first;
                  return prev[t] === next ? prev : { ...prev, [t]: next };
                });
              }}
            >
              {Array.from({ length: slices }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-muted",
                    k === 0 && "rounded-l-lg",
                    k === slices - 1 && "rounded-r-lg",
                  )}
                  style={{
                    // Every strip starts at the tile's centre and is turned
                    // round the axis to its own place on the arc.
                    left: u((aspectRatio - share) / 2),
                    // A pixel wider than its share, so neighbouring facets
                    // overlap and no hairline opens between them. The last
                    // has no neighbour to cover.
                    width:
                      k === slices - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn(
                      (aspectRatio / 2 - (k + 0.5) * share) * unit,
                    ),
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={k === 0 ? (img.alt ?? "") : ""}
                      width={1600}
                      height={1000}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="absolute top-0 max-w-none object-cover"
                      style={{
                        left: u(-k * share),
                        width: u(aspectRatio),
                        height: u(1),
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
