'use client';

import { ChevronDown, CircleHelp, MessageSquare } from 'lucide-react';
import { config } from '@/config';
import { commercialHref } from '@/lib/commercial';
import styles from './BottomFunnel.module.css';
import { ScrollReveal } from './ScrollReveal';
import { useLocale } from '@/lib/locale';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '01',
    question: 'Quanto custa contratar a ezway?',
    answer: 'Valores e condições são definidos com o comercial conforme a solução, a quantidade e o escopo. Entre em contato para alinharmos uma proposta para o seu negócio.',
  },
  {
    id: '02',
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo depende do produto, da personalização ou do escopo do serviço. Converse com a ezway para combinar as etapas e a previsão de entrega do seu pedido.',
  },
  {
    id: '03',
    question: 'O que está incluso no Desenvolvimento ezway?',
    answer: 'O projeto é definido com você: objetivo, páginas, identidade visual e funcionalidades. Sites, landing pages e cardápios digitais são algumas das aplicações. O escopo é alinhado antes do desenvolvimento.',
  },
  {
    id: '04',
    question: 'Como funciona a Placa Inteligente NFC + QR Code?',
    answer: 'A placa reúne NFC e QR Code. O cliente aproxima um celular compatível ou lê o código com a câmera para abrir o link escolhido: cardápio, portfólio, redes sociais ou outra página.',
  },
  {
    id: '05',
    question: 'Como faço para contratar ou adquirir uma placa?',
    answer: 'Os botões da placa e do Desenvolvimento ezway abrem uma conversa com nosso comercial no WhatsApp. Alinhamos sua necessidade, personalização ou escopo, prazos e condições para fechar a venda diretamente com você.',
  },
  {
    id: '06',
    question: 'Preciso ter CNPJ para comprar?',
    answer:
      'Atendemos pessoas físicas e empresas. Nosso comercial orienta quais dados são necessários para a contratação e esclarece as condições de faturamento durante a conversa.',
  },
  {
    id: '07',
    question: 'O que é o EasyChat?',
     answer: 'O EasyChat reúne documentos, notas fiscais, arquivos e lembretes em uma conversa, com revisão antes de compartilhar um contrato. Fale com a equipe para entender o funcionamento e a disponibilidade para o seu negócio.',
  },
  {
    id: '08',
    question: `O que a ${config.brand.name} oferece?`,
    answer: `A ${config.brand.name} desenvolve sites, landing pages e cardápios digitais e oferece placas NFC com QR Code para empresas.`,
  },
];

function FAQAccordionItem({
  item,
  initiallyOpen,
}: {
  item: FAQItem;
  initiallyOpen: boolean;
}) {
  const { t } = useLocale();
  return (
    <details name="nexos-faq" className={styles.faqItem} open={initiallyOpen}>
      <summary className={styles.faqTrigger}>
        <span className={styles.faqIndex} aria-hidden="true">{item.id}</span>
        <span className={styles.faqQuestion}>{t(item.question)}</span>
        <span className={styles.faqIcon} aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </summary>
      <div id={`faq-answer-${item.id}`} role="region" aria-label={t(item.question)} className={styles.faqPanel}>
        <div className={styles.faqAnswer}>
          <p>{t(item.answer)}</p>
        </div>
      </div>
    </details>
  );
}

interface FAQProps {
  className?: string;
}

export function FAQ({ className = '' }: FAQProps) {
  const { t } = useLocale();
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${styles.section} ${styles.faqSection} ${className}`}>
      <div className={styles.container}>
        <div className={styles.sectionNav} aria-label={t('Navegação de suporte')}>
          <span className={styles.currentSection}><CircleHelp size={16} aria-hidden="true" /> {t('Dúvidas frequentes')}</span>
        </div>

        <header className={styles.header}>
          <ScrollReveal as="h2" preset="title" id="faq-title" className={styles.heading}>
            Perguntas frequentes.<br /><span className={styles.accent}>Respostas diretas.</span>
          </ScrollReveal>
          <ScrollReveal as="p" className={styles.lead} delay={.08}>
            Sobre o projeto, a placa e o pedido. Se precisar de mais detalhes, fale com a gente.
          </ScrollReveal>
        </header>

        <ul className={`${styles.faqList} list-none`} role="list" aria-label={t('Perguntas frequentes')}>
          {FAQ_ITEMS.map((item, index) => (
            <ScrollReveal as="li" key={item.id} delay={Math.min(index * .04, .12)}>
              <FAQAccordionItem item={item} initiallyOpen={item.id === FAQ_ITEMS[0].id} />
            </ScrollReveal>
          ))}
        </ul>

        <p className={styles.faqFooter}>
          <CircleHelp size={16} aria-hidden="true" />
          <span>
             {t('Ficou com dúvida?')}{' '}
            <a href={commercialHref()} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
               <MessageSquare size={16} aria-hidden="true" /> {t('Fale com a gente')}
            </a>
          </span>
        </p>
      </div>
    </section>
  );
}

export default FAQ;
