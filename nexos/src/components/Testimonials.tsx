'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowUpRight, Check, Copy, Cpu, CreditCard, Layers, Terminal, Workflow } from 'lucide-react';
import styles from './MidPage.module.css';

const FLUID_EASE = [0.16, 1, 0.3, 1] as const;

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
    actionHref: '#showcase',
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

function navigate(href: string, push?: (h: string) => void): void {
  const el = document.querySelector(href) as HTMLElement | null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else if (push) push(href);
  else window.location.href = href;
}

function ValueRow({ card }: { card: ValueCard }) {
  const router = useRouter();
  return (
    <motion.li variants={RELIEF_CHILD} className={styles.pillarRow}>
      <span className={styles.pillarIcon} aria-hidden="true">
        {card.icon}
      </span>
      <div className={styles.pillarBody}>
        <p className={styles.pillarOverline}>
          <span className={styles.pillarOverlinePrefix}>$</span>
          {card.overline}
          <span className={styles.pillarOverlineId}>{card.id}</span>
        </p>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <p className={styles.pillarMeta}>
          <span className={styles.pillarMetric}>{card.metric}</span>
          <span className={styles.pillarMetricLabel}>{card.metricLabel}</span>
          <span className={styles.pillarPilar}>{card.pilar}</span>
        </p>
      </div>
      <div className={styles.pillarAction}>
        <button
          type="button"
          onClick={() => navigate(card.actionHref, router.push)}
          aria-label={card.actionTag}
          className="btn-secondary-nex"
        >
          <span>{card.actionTag}</span>
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </motion.li>
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
      className={`${styles.section} ${className}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 640px' }}
    >
      <div className={styles.container}>
        <div className={styles.sectionNav} aria-label="Navegação do ecossistema">
          <span className={styles.currentSection}><Workflow size={16} aria-hidden="true" /> Ecossistema</span>
          <a href="#faq">Dúvidas frequentes <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>

        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: FLUID_EASE }}
          className={styles.header}
        >
          <p className={styles.kicker}>Documentação &amp; Ecossistema</p>
          <h2 id="testimonials-title" className={styles.heading}>
            Três pilares.<br /><span className={styles.accent}>Uma operação.</span>
          </h2>
          <p className={styles.lead}>
            Performance absoluta, conexão físico-digital e conversão sem atrito — para transformar tráfego em receita.
          </p>
        </motion.header>

        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
          className={styles.terminal}
          role="region"
          aria-label="Documentação do ecossistema NexOS em visual de terminal"
        >
          <motion.div variants={reduce ? undefined : RELIEF_CHILD} className={styles.terminalBar}>
            <span className={styles.traffic} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <p className={styles.terminalTitle}>
              <Terminal size={13} strokeWidth={2} aria-hidden="true" />
              <span>nexos — ecossistema · zsh</span>
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-live="polite"
              data-copied={copied ? 'true' : 'false'}
              aria-label={copied ? 'Pilares copiados' : 'Copiar pilares do ecossistema'}
              className={styles.copyBtn}
            >
              {copied ? (
                <Check size={13} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Copy size={13} strokeWidth={2} aria-hidden="true" />
              )}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </motion.div>

          <motion.ul
            variants={reduce ? undefined : STAGGER_PARENT}
            role="list"
            aria-label="Pilares de valor NexOS"
            className={styles.pillarList}
          >
            {VALUE_CARDS.map((card) => (
              <ValueRow key={card.id} card={card} />
            ))}
          </motion.ul>

          <div className={styles.terminalStatus}>
            <span>3 pilares · utf-8</span>
            <span className={styles.push}>exit 0 — pronto para escalar</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
