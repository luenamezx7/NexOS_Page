'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, CircleUserRound, LayoutList, Wallet } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import styles from './ManagementPreview.module.css';

const areas = [
  { label: 'Clientes', icon: CircleUserRound },
  { label: 'Vendas', icon: LayoutList },
  { label: 'Financeiro', icon: Wallet },
];

/** An illustrative view of catalogue capabilities; never reads live CRM data. */
export function ManagementPreview() {
  const { t } = useLocale();
  const [area, setArea] = useState(0);
  return <div className={styles.preview} data-management-preview>
    <div className={styles.top}><span className={styles.brand}>controle<span> · ezway</span></span><span className={styles.demo}>{t('Demonstração ilustrativa')}</span></div>
    <div className={styles.workspace}>
      <nav className={styles.tabs} aria-label={t('Explorar a demonstração de gestão')}>
        {areas.map(({ label, icon: Icon }, index) => <button type="button" key={label} aria-pressed={area === index} aria-controls="management-preview-panel" onClick={() => setArea(index)}><Icon size={18} aria-hidden="true" /><span>{t(label)}</span></button>)}
      </nav>
      <div id="management-preview-panel" className={styles.panel} role="region" aria-label={t(areas[area].label)}>
        <header><div><p>{t('Seu negócio em perspectiva')}</p><h3 data-heading-static>{t(area === 0 ? 'Cada cliente, com contexto.' : area === 1 ? 'O próximo passo está à vista.' : 'Entradas e saídas, organizadas.')}</h3></div><span className={styles.panelIcon} aria-hidden="true">{area === 0 ? <CircleUserRound /> : area === 1 ? <LayoutList /> : <Wallet />}</span></header>
        <div key={area} className={styles.content}>
          {area === 0 ? <><div className={styles.tableHead}><span>{t('Cliente')}</span><span>{t('Próximo passo')}</span></div>{[['Ateliê Aurora', 'Revisar proposta'], ['Café Jardim', 'Agendar conversa'], ['Estúdio Ipê', 'Alinhar entrega']].map(([name, action], i) => <div className={styles.row} key={name}><span className={styles.client}><span className={styles.avatar} aria-hidden="true">{name[0]}</span><span><strong>{name}</strong><small>{t('Cliente de demonstração')}</small></span></span><span className={styles.next}><span className={styles.dot} data-tone={i} />{t(action)}</span></div>)}</> : area === 1 ? <div className={styles.pipeline}>{['Em conversa', 'Proposta', 'Retentativas'].map((label, i) => <div key={label}><h4><span className={styles.dot} data-tone={i} />{t(label)}</h4><div className={styles.opportunity}><strong>{['Café Jardim', 'Ateliê Aurora', 'Estúdio Ipê'][i]}</strong><span>{t(['Entender a necessidade', 'Revisar escopo', 'Retomar contato'][i])}</span><ArrowUpRight size={16} aria-hidden="true" /></div></div>)}</div> : <><div className={styles.financeSummary}>{['Receitas', 'Despesas', 'A receber'].map((label, i) => <div key={label}><span className={styles.dot} data-tone={i} /><strong>{t(label)}</strong><small>{t('Visão por período')}</small></div>)}</div><div className={styles.financeRow}><span>{t('Venda do cliente')}</span><span>{t('Lançamento financeiro')}</span><Check size={16} aria-hidden="true" /></div><p className={styles.footnote}>{t('Consulte a situação dos recebimentos e acompanhe sua rotina financeira.')}</p></>}
        </div>
      </div>
    </div>
    <div className={styles.bottom}><span><Check size={14} aria-hidden="true" />{t('Clientes, vendas e financeiro')}</span><span>{t('Dados fictícios')}</span></div>
  </div>;
}
