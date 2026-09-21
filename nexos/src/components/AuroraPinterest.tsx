"use client";

export function AuroraPinterest({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      {/* Manchas como na referência — magenta quente topo, lavanda baixo */}
      <div className="absolute -top-[8%] -left-[6%] h-[44%] w-[42%] rounded-full bg-[#E0118A] opacity-[0.62] blur-[52px]" />
      <div className="absolute -top-[4%] -right-[8%] h-[52%] w-[38%] rounded-full bg-[#E0118A] opacity-[0.58] blur-[48px]" style={{ borderRadius: '42% 58% 38% 62% / 48% 42% 58% 52%' }} />
      <div className="absolute bottom-[18%] -left-[10%] h-[46%] w-[52%] rounded-full bg-[#CE53E0] opacity-[0.42] blur-[54px]" style={{ borderRadius: '58% 42% 62% 38% / 38% 58% 42% 62%' }} />
      <div className="absolute -bottom-[6%] right-[6%] h-[38%] w-[34%] rounded-full bg-[#d8a0f0] opacity-[0.38] blur-[44px]" />
      {/* Curva escura central em S */}
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_48%_52%,transparent_32%,rgba(10,10,15,0.55)_72%)]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}
