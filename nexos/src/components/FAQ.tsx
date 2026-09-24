'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronDown, CircleHelp, MessageSquare } from 'lucide-react';
import styles from './BottomFunnel.module.css';

const FLUID_EASE = [0.16, 1, 0.3, 1] as const;

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
    question: 'O checkout é seguro?',
    answer:
      'Sim. O pagamento roda no Asaas: Pix com QR na hora, boleto e cartão em até 12x, com confirmação automática em segundos. Recebemos apenas nome e e-mail para o recibo — nenhum dado bancário toca nossos servidores.',
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
      'Não. O Pix funciona com CPF e cai na hora. Para faturamento empresarial emitimos nota — chame no WhatsApp após o pagamento.',
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
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.faqItem} data-open={isOpen ? 'true' : 'false'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
        className={styles.faqTrigger}
      >
        <span className={styles.faqIndex} aria-hidden="true">{item.id}</span>
        <span className={styles.faqQuestion}>{item.question}</span>
        <span className={styles.faqIcon} aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            role="region"
            aria-label={item.question}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: FLUID_EASE }}
            className={styles.faqPanel}
          >
            <div className={styles.faqAnswer}>
              <p>{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FAQProps {
  className?: string;
}

export function FAQ({ className = '' }: FAQProps) {
  const reduce = useReducedMotion() ?? false;
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  return (
    <section id="faq" aria-labelledby="faq-title" className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <div className={styles.sectionNav} aria-label="Navegação de suporte">
          <span className={styles.currentSection}><CircleHelp size={16} aria-hidden="true" /> Dúvidas frequentes</span>
          <a href="#contact">Falar com a gente <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>

        <motion.header
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: FLUID_EASE }}
          className={styles.header}
        >
          <p className={styles.kicker}>FAQ</p>
          <h2 id="faq-title" className={styles.heading}>
            Perguntas frequentes.<br /><span className={styles.accent}>Respostas diretas.</span>
          </h2>
          <p className={styles.lead}>
            Performance, placas e checkout. Sem clichê — só o que impacta seu negócio.
          </p>
        </motion.header>

        <div className={styles.faqList} role="list" aria-label="Perguntas frequentes">
          {FAQ_ITEMS.map((item) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
            />
          ))}
        </div>

        <p className={styles.faqFooter}>
          <CircleHelp size={16} aria-hidden="true" />
          <span>
            Ficou com dúvida?{' '}
            <a href="#contact" className={styles.textLink}>
              <MessageSquare size={16} aria-hidden="true" /> Fale com a gente
            </a>
          </span>
        </p>
      </div>
    </section>
  );
}

export default FAQ;
