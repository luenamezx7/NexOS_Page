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
      'O projeto é definido com você: objetivo, páginas, identidade visual e funcionalidades. Sites, landing pages e cardápios digitais são algumas das aplicações. O escopo é alinhado antes do desenvolvimento.',
  },
  {
    id: '03',
    question: 'Como funciona a Placa Inteligente NFC + QR Code?',
    answer:
      'A placa reúne NFC e QR Code. O cliente aproxima um celular compatível ou lê o código com a câmera para abrir o link escolhido: cardápio, portfólio, redes sociais ou outra página.',
  },
  {
    id: '04',
    question: 'O checkout é seguro?',
    answer:
      'O fluxo utiliza o Asaas para processar o pagamento. Você revisa o pedido, preenche os dados necessários e escolhe entre as formas de pagamento disponíveis no checkout.',
  },
  {
    id: '05',
    question: 'Qual o prazo de entrega?',
    answer:
      'O prazo depende do produto, da personalização ou do escopo do serviço. Converse com a NexOS para combinar as etapas e a previsão de entrega do seu pedido.',
  },
  {
    id: '06',
    question: 'Preciso ter CNPJ para comprar?',
    answer:
      'Você pode informar CPF ou CNPJ no checkout. Para dúvidas sobre dados de cobrança e faturamento, fale com a NexOS antes de concluir o pedido.',
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
    <section id="faq" aria-labelledby="faq-title" className={`${styles.section} ${styles.faqSection} ${className}`}>
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
            Sobre o projeto, a placa e o pedido. Se precisar de mais detalhes, fale com a gente.
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
