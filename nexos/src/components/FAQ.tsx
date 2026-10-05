import { ArrowUpRight, ChevronDown, CircleHelp, MessageSquare } from 'lucide-react';
import { config } from '@/config';
import styles from './BottomFunnel.module.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '01',
    question: `${config.brand.name}, ${config.brand.fullName} e ${config.brand.alternateNames.join(' e ')} são a mesma empresa?`,
    answer: `Sim. ${config.brand.fullName} é o nome completo da ${config.brand.name}, também conhecida como ${config.brand.alternateNames.join(' e ')}. Nosso site oficial é nexoslab.online. Desenvolvemos sites, landing pages e cardápios digitais e oferecemos placas NFC com QR Code para empresas.`,
  },
  {
    id: '02',
    question: 'O que está incluso no Desenvolvimento NexOS?',
    answer:
      'Entrega sob medida com arquitetura limpa, CI/CD, observabilidade e documentação técnica. Código em Next.js/TypeScript pronto para escalar a 60–120 FPS sem gargalos.',
  },
  {
    id: '03',
    question: 'Como funciona a Placa Inteligente NFC + QR Code?',
    answer:
      'Acrílico cristal cortado a laser com chip NFC e QR Code. O cliente aproxima o celular ou escaneia e abre seu link em menos de 1 segundo — cardápio, portfólio ou Instagram sem atrito.',
  },
  {
    id: '04',
    question: 'O checkout é seguro?',
    answer:
      'Sim. O pagamento roda no Asaas: Pix com QR na hora, boleto e cartão em até 12x, com confirmação automática em segundos. Recebemos apenas nome e e-mail para o recibo — nenhum dado bancário toca nossos servidores.',
  },
  {
    id: '05',
    question: 'Qual o prazo de entrega?',
    answer:
      'Placas: envio em até 3 dias úteis após confirmação. Desenvolvimento: kickoff em 48h e entregas incrementais — MVP validado em ciclos curtos com performance <0.8s LCP.',
  },
  {
    id: '06',
    question: 'Preciso ter CNPJ para comprar?',
    answer:
      'Não. O Pix funciona com CPF e cai na hora. Para faturamento empresarial emitimos nota — chame no WhatsApp após o pagamento.',
  },
  {
    id: '07',
    question: 'Como é calculado o frete?',
    answer: 'Calculamos o frete de acordo com sua região.',
  },
];

function FAQAccordionItem({
  item,
  initiallyOpen,
}: {
  item: FAQItem;
  initiallyOpen: boolean;
}) {
  return (
    <details name="nexos-faq" className={styles.faqItem} open={initiallyOpen}>
      <summary className={styles.faqTrigger}>
        <span className={styles.faqIndex} aria-hidden="true">{item.id}</span>
        <span className={styles.faqQuestion}>{item.question}</span>
        <span className={styles.faqIcon} aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </summary>
      <div id={`faq-answer-${item.id}`} role="region" aria-label={item.question} className={styles.faqPanel}>
        <div className={styles.faqAnswer}>
          <p>{item.answer}</p>
        </div>
      </div>
    </details>
  );
}

interface FAQProps {
  className?: string;
}

export function FAQ({ className = '' }: FAQProps) {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <div className={styles.sectionNav} aria-label="Navegação de suporte">
          <span className={styles.currentSection}><CircleHelp size={16} aria-hidden="true" /> Dúvidas frequentes</span>
          <a href="#contact">Falar com a gente <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>

        <header className={styles.header}>
          <p className={styles.kicker}>FAQ</p>
          <h2 id="faq-title" className={styles.heading}>
            Perguntas frequentes.<br /><span className={styles.accent}>Respostas diretas.</span>
          </h2>
          <p className={styles.lead}>
            Performance, placas e checkout. Sem clichê — só o que impacta seu negócio.
          </p>
        </header>

        <ul className={`${styles.faqList} list-none`} role="list" aria-label="Perguntas frequentes">
          {FAQ_ITEMS.map((item) => (
            <li key={item.id}>
              <FAQAccordionItem item={item} initiallyOpen={item.id === FAQ_ITEMS[0].id} />
            </li>
          ))}
        </ul>

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
