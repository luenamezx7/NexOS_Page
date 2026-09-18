'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: FLUID_EASE },
  },
};

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '01',
    question: 'O que está incluso no Desenvolvimento NexOS?',
    answer:
      'Entrega sob medida com arquitetura limpa, CI/CD, observabilidade e documentação técnica. Código em Next.js/TypeScript pronto para escalar a 60–120 FPS sem gargalos.',
  },
  {
    id: '02',
    question: 'Como funciona a Placa Inteligente NFC + QR Code?',
    answer:
      'Acrílico cristal cortado a laser com chip NFC e QR Code. O cliente aproxima o celular ou escaneia e abre seu link em menos de 1 segundo — cardápio, portfólio ou Instagram sem atrito.',
  },
  {
    id: '03',
    question: 'O checkout transparente é seguro?',
    answer:
      'Sim. O cartão roda em Stripe Checkout Sessions com Payment Element em iFrame isolado (PCI-DSS) — nenhum dado de cartão toca nossos servidores. O Pix roda na aba “Pix · Taxa zero” via InfinitePay, com QR Code embutido no próprio checkout.',
  },
  {
    id: '04',
    question: 'Qual o prazo de entrega?',
    answer:
      'Placas: envio em até 3 dias úteis após confirmação. Desenvolvimento: kickoff em 48h e entregas incrementais — MVP validado em ciclos curtos com performance <0.8s LCP.',
  },
  {
    id: '05',
    question: 'Preciso ter CNPJ para comprar?',
    answer:
      'Não. Pix e cartão funcionam com CPF. Para faturamento empresarial emitimos nota. O boleto foi desabilitado para evitar conflito de tax ID — use Pix ou cartão.',
  },
  {
    id: '06',
    question: 'Como é calculado o frete?',
    answer: 'Calculamos o frete de acordo com sua região.',
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
  reduceMotion,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      className="bento-card group overflow-hidden p-0 transition-colors duration-300 hover:border-ink/25"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:px-7"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="hidden font-mono text-xs tracking-[0.14em] text-ink/35 md:inline">{item.id}</span>
          <span className="text-sm font-semibold leading-snug text-ink md:text-[15px]">{item.question}</span>
        </span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
            isOpen ? 'border-pink-500/40 bg-[#ff2e6a]/10 text-ink' : 'border-ink/10 bg-ink/[0.03] text-ink/50 group-hover:border-pink-500/20 group-hover:text-ink'
          }`}
          aria-hidden="true"
        >
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: FLUID_EASE }}
            className="grid place-items-center"
          >
            <ChevronDown size={16} strokeWidth={2} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: FLUID_EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink/10 px-6 pb-6 pt-4 md:px-7">
              <p className="text-sm leading-relaxed text-ink/70">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FAQProps {
  className?: string;
}

export function FAQ({ className = '' }: FAQProps) {
  const reduce = useReducedMotion() ?? false;
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  return (
    <section id="faq" aria-labelledby="faq-title" className={`relative border-t border-ink/10 bg-canvas ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mb-12 max-w-2xl will-change-transform md:mb-16"
        >
          <h2 id="faq-title" className="flex flex-row items-start gap-3 text-ink">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70 md:text-lg">
            Respostas diretas sobre performance, placas e checkout. Sem clichês, só o que impacta seu negócio.
          </p>
        </motion.header>

        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-4 md:gap-5"
          role="list"
          aria-label="Perguntas frequentes"
        >
          {FAQ_ITEMS.map((item) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
              reduceMotion={reduce}
            />
          ))}
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: FLUID_EASE, delay: 0.2 }}
          className="mt-10 flex flex-row items-center justify-center gap-2 text-center text-sm text-ink/45"
        >
          <HelpCircle size={16} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
          <span>
            Ficou com dúvida? <a href="#contact" className="font-medium text-ink underline underline-offset-4 hover:text-ink/80">Fale com a gente</a>
          </span>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQ;
