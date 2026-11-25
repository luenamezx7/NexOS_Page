'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, ContactRound, FileText, Globe, Link2, MessageCircle, Nfc, Wallet } from 'lucide-react';
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
  return <section ref={root} id="comparacao" data-comparison-ready={visible} className={styles.section} aria-labelledby="comparison-title">
    <div className={styles.container}>
      <header className={styles.header}><h2 id="comparison-title" data-heading-static>{t('Seu negócio,')}<br />{t('sem e com a EZWAY.')}</h2><p>{t('Da operação à presença digital. Veja o que cada solução pode organizar no seu negócio.')}</p></header>
      <div className={styles.comparison}>
        <div className={styles.labels} aria-hidden="true"><span>{t('Sem EZWAY')}<small>{t('Mais tarefas manuais')}</small></span><span>{t('Com EZWAY')}<small>{t('Caminhos mais simples')}</small></span></div>
        {comparisons.map(({ id, category, before, after, detail, icon: Icon }, index) => <article className={styles.pair} key={id} style={{ '--pair-delay': `${index * 100}ms` } as React.CSSProperties} aria-labelledby={`comparison-${id}`}>
          <div className={styles.before}>
            <span className={styles.mobileLabel}>{t('Sem EZWAY')}</span><p className={styles.category}>{t(category)}</p><h3 id={`comparison-${id}`} data-heading-static>{t(before)}</h3>
            <div className={styles.scattered} aria-hidden="true">
              {id === 'routine' ? <><span><ContactRound />{t('Contatos')}</span><span><FileText />{t('Planilhas')}</span><span><Wallet />{t('Anotações')}</span></> : id === 'presence' ? <><span><FileText />PDF</span><span><MessageCircle />{t('Mensagem')}</span><span><Link2 />{t('Links soltos')}</span></> : <><span><MessageCircle />{t('Pedir o contato')}</span><span><FileText />{t('Digitar o endereço')}</span></>}
            </div>
          </div>
          <span className={styles.bridge} aria-hidden="true"><ArrowRight size={18} /></span>
          <div className={styles.after} data-comparison-result>
            <span className={styles.mobileLabel}>{t('Com EZWAY')}</span><div className={styles.resultTitle}><Icon size={22} aria-hidden="true" /><h3 data-heading-static>{t(after)}</h3></div><p>{t(detail)}</p>
            <div className={styles.organized} aria-hidden="true">
              {id === 'routine' ? <><span><Check />{t('Clientes')}</span><i /><span><Check />{t('Vendas')}</span><i /><span><Check />{t('Financeiro')}</span></> : id === 'presence' ? <><span className={styles.address}>sua-marca</span><i /><span>{t('Site')}</span><span>{t('Catálogo')}</span><span>{t('Contato')}</span></> : <><Nfc size={24} /><i /><span>{t('Seu destino digital')}</span><ArrowUpRight size={18} /></>}
            </div>
          </div>
        </article>)}
      </div>
      <div className={styles.future}><MessageCircle size={22} aria-hidden="true" /><div><h3 data-heading-static>{t('E a rotina com apoio de IA?')}</h3><p>{t('O EasyChat está em desenvolvimento. Conheça a prévia do assistente administrativo e suas funcionalidades previstas.')}</p></div><a href="#easychat">{t('Ver a prévia')}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
      <div className={styles.close}><p>{t('Você escolhe as soluções. A gente alinha o escopo e acompanha a implementação.')}</p><Button size="xl" variant="secondary" render={<a href={commercialHref(t(diagnosticMessage))} target="_blank" rel="noopener noreferrer" />} data-cta-section="comparacao" data-cta-solution="diagnostico">{t('Conversar sobre meu negócio')}<ArrowUpRight size={18} aria-hidden="true" /></Button></div>
      <p className={styles.note}>{t('Soluções contratadas conforme a necessidade. Disponibilidade, integrações e condições são definidas para cada projeto.')}</p>
    </div>
  </section>;
}
