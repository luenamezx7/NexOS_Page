"use client";

// Reversível: troque FABRIC_ENABLED para false para voltar à AuroraPinterest
export const FABRIC_ENABLED = false;

export function FabricDune({ className = "" }: { className?: string }) {
  if (!FABRIC_ENABLED) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#080c14] ${className}`} aria-hidden="true">
      {/* Imagem base — tecido escuro com fenda */}
      <img
        src="https://i.pinimg.com/1200x/f6/43/4f/f6434f4f383e333fc83b0889891d1495.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95"
        loading="lazy"
        decoding="async"
      />
      {/* Vinheta escura para texto legível + transição para canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
      {/* Grain sutil para quebrar clean digital */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
