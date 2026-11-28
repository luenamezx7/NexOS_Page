'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import Image from 'next/image';
import { ArrowUpRight, Check, ContactRound, FileText, Globe, Link2, MessageCircle, Nfc, Sparkles, Wallet, X } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { commercialHref } from '@/lib/commercial';
import { diagnosticMessage } from '@/config/solutions';
import { Button } from '../ui/cnippet-button';
import styles from './BusinessComparison.module.css';

const comparisons = [
  { id: 'routine', category: 'Na operação', before: 'Cada informação em um lugar.', after: 'Uma visão da sua rotina.', detail: 'Clientes, acompanhamento de vendas e financeiro em uma plataforma.', icon: ContactRound },
  { id: 'presence', category: 'Na presença digital', before: 'O cliente precisa procurar.', after: 'Seu negócio tem um endereço.', detail: 'Site, cardápio ou catálogo digital com caminhos claros para o contato.', icon: Globe },
  { id: 'connection', category: 'No contato presencial', before: 'Do interesse ao contato, mais etapas.', after: 'Aproximou. Encontrou.', detail: 'NFC e QR Code levam ao link escolhido: contato, cardápio ou avaliações.', icon: Nfc },
];

export function BusinessComparison() {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root, { once: true, amount: .12 });
  const onScreen = useInView(root);
  return <section ref={root} id="comparacao" data-comparison-ready={visible} data-onscreen={onScreen || undefined} className={styles.section} aria-labelledby="comparison-title">
    <div className={styles.container}>
      <header className={styles.header}><h2 id="comparison-title" data-heading-static>{t('Seu negócio,')}<br />{t('sem e com a EZWAY.')}</h2><p>{t('Da operação à presença digital. Veja o que cada solução pode organizar no seu negócio.')}</p></header>
      <div className={styles.versus}>
        <div className={styles.without} aria-labelledby="comparison-without">
          <p className={styles.sideLabel} id="comparison-without"><X size={16} aria-hidden="true" />{t('Sem EZWAY')}</p>
          <p className={styles.sideHint}>{t('Mais tarefas manuais')}</p>
          <ul className={styles.withoutList}>{comparisons.map(({ id, category, before }) => <li key={id}>
            <small>{t(category)}</small>
            <span>{t(before)}</span>
            <span className={styles.scattered} aria-hidden="true">
              {id === 'routine' ? <><i><ContactRound />{t('Contatos')}</i><i><FileText />{t('Planilhas')}</i><i><Wallet />{t('Anotações')}</i></> : id === 'presence' ? <><i><FileText />PDF</i><i><MessageCircle />{t('Mensagem')}</i><i><Link2 />{t('Links soltos')}</i></> : <><i><MessageCircle />{t('Pedir o contato')}</i><i><FileText />{t('Digitar o endereço')}</i></>}
            </span>
          </li>)}</ul>
        </div>

        <div className={styles.withSide}>
          <div className={styles.withCard} data-comparison-result aria-labelledby="comparison-with">
            <p className={styles.sideLabel} id="comparison-with"><Sparkles size={16} aria-hidden="true" />{t('Com EZWAY')}</p>
            <p className={styles.sideHint}>{t('Caminhos mais simples')}</p>
            <ul className={styles.withList}>{comparisons.map(({ id, after, detail, icon: Icon }, index) => <li key={id} style={{ '--pair-delay': `${index * 120}ms` } as React.CSSProperties}>
              <span className={styles.withIcon} data-tone={index}><Icon size={20} aria-hidden="true" /></span>
              <span><strong id={`comparison-${id}`}>{t(after)}</strong><small>{t(detail)}</small></span>
              <Check className={styles.withCheck} size={18} aria-hidden="true" />
            </li>)}</ul>
            <div className={styles.wins} aria-label={t('Vantagens')}>
              {['Tudo em um só lugar', 'Atendimento mais rápido', 'Presença profissional'].map(win => <span key={win}><Check size={13} aria-hidden="true" />{t(win)}</span>)}
            </div>
          </div>
          <div className={styles.hand} aria-hidden="true"><Image src="/media/maos-extend.png" alt="" fill sizes="(max-width: 767px) 90vw, 620px" /></div>
        </div>
      </div>
      <div className={styles.future}><MessageCircle size={22} aria-hidden="true" /><div><h3 data-heading-static>{t('E a rotina com apoio de IA?')}</h3><p>{t('O EasyChat está em desenvolvimento. Conheça a prévia do assistente administrativo e suas funcionalidades previstas.')}</p></div><a href="#easychat">{t('Ver a prévia')}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
      <div className={styles.close}><p>{t('Você escolhe as soluções. A gente alinha o escopo e acompanha a implementação.')}</p><Button size="xl" variant="secondary" render={<a href={commercialHref(t(diagnosticMessage))} target="_blank" rel="noopener noreferrer" />} data-cta-section="comparacao" data-cta-solution="diagnostico">{t('Conversar sobre meu negócio')}<ArrowUpRight size={18} aria-hidden="true" /></Button></div>
      <p className={styles.note}>{t('Soluções contratadas conforme a necessidade. Disponibilidade, integrações e condições são definidas para cada projeto.')}</p>
    </div>
  </section>;
}
