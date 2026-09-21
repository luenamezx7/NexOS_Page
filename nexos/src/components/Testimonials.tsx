'use client';

import { useCallback, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Cpu, Layers, CreditCard, ArrowRight, Check, Copy, Terminal } from 'lucide-react';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Perf: anima SÓ opacity + y (transform GPU). Sem scale — scale força repaint
// durante o scroll pela seção (era a causa do jank no Ecossistema).
const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: FLUID_EASE },
  },
};

// ============================================================
// NexOS — Documentação & Ecossistema (Code-Viewer / Unix terminal UI)
// Substitui o grid de cards por uma janela macOS com Clipboard API.
// Perf: content-visibility + contain-intrinsic-size pula pintura off-screen,
// sem will-change permanente, sem blur, só transform/opacity.
// ============================================================

interface ValueCard {
  id: string;
  overline: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  actionTag: string;
  actionHref: string;
  icon: React.ReactNode;
  pilar: string;
}

const VALUE_CARDS: ValueCard[] = [
  {
    id: 'BENTO_NFC_ACRYLIC',
    overline: 'TECNOLOGIA FÍSICA',
    title: 'Conexão por Aproximação Sem Atrito',
    description:
      'Placas de acrílico cristal cortadas a laser com NFC e QR Code integrado. Permitem que seu cliente acesse cardápios, portfólios ou redes sociais em menos de 1 segundo, eliminando barreiras no atendimento.',
    metric: 'Instantâneo',
    metricLabel: 'NFC / QR',
    actionTag: 'Adquirir em Lote',
    actionHref: '#services',
    icon: <Layers size={15} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 2 — DESIGN INDUSTRIAL-TECH',
  },
  {
    id: 'BENTO_EMBEDDED_CHECKOUT',
    overline: 'CHECKOUT TRANSPARENTE',
    title: 'Conversão Máxima Sem Redirecionamentos',
    description:
      'Processe pagamentos diretamente na sua landing page sem enviar o cliente para links externos. Reduza o abandono de carrinho mantendo a coesão visual e a confiança do comprador no mesmo ambiente.',
    metric: '+35%',
    metricLabel: 'taxa de finalização',
    actionTag: 'Ver Demonstração',
    actionHref: '#services',
    icon: <CreditCard size={15} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 3 — CONVERSÃO & RETENÇÃO',
  },
  {
    id: 'BENTO_PERFORMANCE_60FPS',
    overline: 'ENGINE & SPEED',
    title: 'Fluidez Imersiva a 60–120 FPS',
    description:
      'Arquitetura acelerada por GPU que garante navegação contínua e sem interrupções em qualquer dispositivo. Otimização severa que converte visitantes em clientes engajados.',
    metric: '< 0.8s',
    metricLabel: 'LCP / 120Hz',
    actionTag: 'Conhecer a Arquitetura',
    actionHref: '#hero',
    icon: <Cpu size={15} strokeWidth={1.75} aria-hidden="true" />,
    pilar: 'PILAR 1 — PERFORMANCE ABSOLUTA',
  },
];

const CLIPBOARD_PAYLOAD = VALUE_CARDS.map(
  (c) => `$ nexos pillar --id ${c.id}\n  overline: ${c.overline}\n  title: ${c.title}\n  metric: ${c.metric} ${c.metricLabel}\n  pilar: ${c.pilar}`,
).join('\n\n');

function navigate(href: string): void {
  const el = document.querySelector(href) as HTMLElement | null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.location.href = href;
}

function ValueRow({ card }: { card: ValueCard }) {
  return (
    <li className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-ink/10 px-4 py-5 last:border-b-0 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-6">
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink/10 bg-ink/[0.04] font-mono text-[11px] text-ink/70 transition-colors duration-300 group-hover:border-pink-500/40 group-hover:text-ink md:mt-0"
        aria-hidden="true"
      >
        {card.icon}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff5c8a]">
          <span className="mr-2 text-ink/30">$</span>
          {card.overline}
          <span className="ml-2 hidden text-ink/30 sm:inline">{card.id}</span>
        </p>
        <h3 className="mt-1 break-words text-[15px] font-bold leading-snug tracking-tight text-ink">{card.title}</h3>
        <p className="mt-1 break-words text-[13px] leading-relaxed text-ink/65">{card.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
          <span className="font-bold text-ink">{card.metric}</span>
          <span className="uppercase tracking-[0.14em] text-ink/45">{card.metricLabel}</span>
          <span className="uppercase tracking-[0.14em] text-ink/30">· {card.pilar}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(card.actionHref)}
        aria-label={card.actionTag}
        className="btn-secondary-nex col-span-2 mt-1 w-full !justify-between !py-2 !text-xs md:col-span-1 md:mt-0 md:w-auto md:min-w-[190px]"
      >
        <span>{card.actionTag}</span>
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
}

interface TestimonialsProps {
  className?: string;
}

export function Testimonials({ className = '' }: TestimonialsProps) {
  const reduce = useReducedMotion() ?? false;
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CLIPBOARD_PAYLOAD);
    } catch {
      // Fallback para contextos sem Clipboard API (http / permissões)
      const ta = document.createElement('textarea');
      ta.value = CLIPBOARD_PAYLOAD;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* silencioso */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, []);

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className={`relative w-full max-w-full overflow-clip overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 640px' }}
    >
      <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 md:px-8 md:py-32">
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: FLUID_EASE }}
          className="mb-10 max-w-2xl md:mb-14"
        >
          <h2 id="testimonials-title" className="flex flex-row items-start gap-3 text-ink">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Documentação &amp; Ecossistema
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70 md:text-lg">
            Três pilares de valor para transformar tráfego em receita: performance absoluta, conexão físico-digital e conversão sem atrito.
          </p>
        </motion.header>

        {/* ——— Unix / macOS code-viewer window ——— */}
        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
          className="overflow-hidden rounded-2xl border border-ink/10 bg-[var(--color-card)] shadow-[0_18px_60px_-24px_rgba(0,0,0,0.45)]"
          role="region"
          aria-label="Documentação do ecossistema NexOS em visual de terminal"
        >
          {/* Title bar */}
          <motion.div
            variants={reduce ? undefined : RELIEF_CHILD}
            className="relative flex items-center gap-3 border-b border-ink/10 bg-ink/[0.03] px-4 py-3 md:px-5"
          >
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </span>
            <p className="flex min-w-0 flex-1 items-center gap-2 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50">
              <Terminal size={13} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span className="truncate">nexos — ecossistema · zsh</span>
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-live="polite"
              aria-label={copied ? 'Pilares copiados' : 'Copiar pilares do ecossistema'}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/[0.04] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60 transition-colors duration-200 hover:border-pink-500/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:right-4"
            >
              {copied ? (
                <Check size={13} strokeWidth={2.5} aria-hidden="true" className="text-[#28c840]" />
              ) : (
                <Copy size={13} strokeWidth={2} aria-hidden="true" />
              )}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </motion.div>

          {/* Body: pilares como linhas de terminal */}
          <motion.ul
            variants={reduce ? undefined : STAGGER_PARENT}
            role="list"
            aria-label="Pilares de valor NexOS"
            className="divide-y divide-transparent"
          >
            {VALUE_CARDS.map((card) => (
              <motion.div key={card.id} variants={reduce ? undefined : RELIEF_CHILD}>
                <ValueRow card={card} />
              </motion.div>
            ))}
          </motion.ul>

          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/10 bg-ink/[0.02] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
            <span>3 pilares · utf-8</span>
            <span className="ml-auto">exit 0 — pronto para escalar</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
