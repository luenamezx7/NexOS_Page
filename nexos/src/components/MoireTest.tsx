"use client";

// Reversível: MOIRE_ENABLED = false volta ao TextPressure puro
export const MOIRE_ENABLED = false;

export function MoireOverlay({ className = "" }: { className?: string }) {
  if (!MOIRE_ENABLED) return null;
  return (
    <>
      <style>{`@keyframes moireWave{0%{transform:translateX(0) skewX(0deg)}50%{transform:translateX(1px) skewX(0.6deg)}100%{transform:translateX(0) skewX(0deg)}}`}</style>
      <div
        className={`pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.28] ${className}`}
        aria-hidden="true"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 2px, rgba(255,92,138,0.52) 2px 3px)`,
          maskImage: `repeating-linear-gradient(0deg, black 0 2px, transparent 2px 4px)`,
          WebkitMaskImage: `repeating-linear-gradient(0deg, black 0 2px, transparent 2px 4px)`,
          animation: 'moireWave 2.8s ease-in-out infinite',
        }}
      />
    </>
  );
}
