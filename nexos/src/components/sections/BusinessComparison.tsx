'use client';

import Image from 'next/image';
import { useLocale } from '@/lib/locale';
import styles from './BusinessComparison.module.css';

const pairs = [
  ['Contatos espalhados', 'Histórico organizado', 'Consulte os dados e o histórico de cada relacionamento.'],
  ['Retornos dependentes da memória', 'Acompanhamentos agendados', 'Registre o próximo acompanhamento para dar continuidade à conversa.'],
  ['Recusas sem continuidade', 'Oportunidades em Retentativas', 'Separe oportunidades para um novo contato no pipeline.'],
  ['Vendas e recebimentos desconectados', 'Visão organizada da operação', 'Acompanhe vendas do cliente e a situação dos lançamentos financeiros.'],
  ['Serviços apresentados em vários lugares', 'Presença digital com caminhos claros', 'Reúna a apresentação e as formas de contato em um site ou portfólio.'],
];

export function BusinessComparison() {
  const { t } = useLocale();
  return <section id="comparacao" className={styles.section} aria-labelledby="comparison-title"><div className={styles.container}>
    <header><Image src="/logo-ghost.svg" unoptimized style={{ filter: 'invert(1)' }} alt="" width={80} height={80} /><div><p>{t('DA ROTINA ESPALHADA AO PRÓXIMO PASSO')}</p><h2 data-heading-static id="comparison-title">{t('Menos caminhos perdidos. Mais clareza para agir.')}</h2></div></header>
    <div className={styles.labels} aria-hidden="true"><span>{t('Sem EZWAY')}</span><span>{t('Com EZWAY')}</span></div>
    <ul>{pairs.map(([before, after, mechanism]) => <li key={before}><div className={styles.before}><span>{t('Sem EZWAY')}</span><h3 data-heading-static>{t(before)}</h3></div><div className={styles.after}><span>{t('Com EZWAY')}</span><h3 data-heading-static>{t(after)}</h3><p>{t(mechanism)}</p></div></li>)}</ul>
    <p className={styles.note}>{t('Cada mudança depende da solução escolhida e do escopo definido; não representa resultado garantido nem integração automática.')}</p>
  </div></section>;
}
