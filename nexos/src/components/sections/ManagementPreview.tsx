'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Bell, CalendarDays, CircleUserRound, LayoutList, Search, Wallet } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import styles from './ManagementPreview.module.css';

const areas = [
  { label: 'Clientes', icon: CircleUserRound },
  { label: 'Vendas', icon: LayoutList },
  { label: 'Financeiro', icon: Wallet },
] as const;

const months = ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'];
const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

/* Illustrative numbers only; this component never reads live CRM data. */
const series = {
  clients: [14, 19, 17, 24, 22, 29, 27, 32],
  sales: [21.4, 24.8, 23.1, 29.6, 34.2, 41.8],
  revenue: [9.8, 11.2, 10.6, 12.4, 13.9, 15.8],
  costs: [6.4, 7.1, 6.9, 7.6, 8.2, 9.1],
};

const clientRows = [
  { name: 'Ateliê Aurora', segment: 'Moda autoral', next: 'Revisar proposta', when: 'Hoje, 14h', tone: 0 },
  { name: 'Café Jardim', segment: 'Cafeteria', next: 'Agendar conversa', when: 'Amanhã', tone: 1 },
  { name: 'Estúdio Ipê', segment: 'Arquitetura', next: 'Alinhar entrega', when: 'Qui, 10h', tone: 2 },
  { name: 'Padaria Horizonte', segment: 'Padaria', next: 'Enviar orçamento', when: 'Sex', tone: 0 },
];

const pipeline = [
  { stage: 'Novo contato', tone: 2, cards: [['Barbearia Norte', 'R$ 1.200'], ['Clínica Sol', 'R$ 2.900']] },
  { stage: 'Em conversa', tone: 0, cards: [['Café Jardim', 'R$ 3.400'], ['Padaria Horizonte', 'R$ 1.850']] },
  { stage: 'Proposta', tone: 1, cards: [['Ateliê Aurora', 'R$ 6.200']] },
  { stage: 'Fechado', tone: 3, cards: [['Estúdio Ipê', 'R$ 8.700'], ['Pet Lar', 'R$ 2.100']] },
];

const ledger = [
  { label: 'Venda · Estúdio Ipê', kind: 'in', value: 8700, date: '26 nov' },
  { label: 'Fornecedor · Embalagens', kind: 'out', value: 1240, date: '25 nov' },
  { label: 'Venda · Café Jardim', kind: 'in', value: 420, date: '25 nov' },
  { label: 'Parcela · Ateliê Aurora', kind: 'pending', value: 3100, date: '30 nov' },
];

const toasts = [
  ['Nova venda registrada', 'Café Jardim · R$ 420'],
  ['Retorno agendado', 'Ateliê Aurora · hoje, 14h'],
  ['Pagamento recebido', 'Estúdio Ipê · R$ 8.700'],
  ['Novo contato', 'Barbearia Norte · via WhatsApp'],
];

/** Builds a smooth (monotone-ish) SVG path through points scaled into a box. */
function chartPath(values: number[], w: number, h: number, max: number, pad = 6) {
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)] as const);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return { d, pts, area: `${d} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z` };
}

function useVisible<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: .2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible] as const;
}

export function ManagementPreview() {
  const { t, locale } = useLocale();
  const [area, setArea] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [toast, setToast] = useState(0);
  const [rootRef, visible] = useVisible<HTMLDivElement>();
  const gradientId = useId().replace(/:/g, '');
  const money = useMemo(() => new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), [locale]);

  // A light "live" feel: cycle a notification while the dashboard is on screen.
  useEffect(() => {
    if (!visible || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setToast(n => (n + 1) % toasts.length), 3800);
    return () => clearInterval(id);
  }, [visible]);

  const kpis = area === 0
    ? [['Clientes ativos', '248', '+12%', true], ['Novos no mês', '32', '+8', true], ['Retornos hoje', '6', '2 urgentes', false], ['Satisfação', '4,9', '★ média', true]]
    : area === 1
      ? [['Em negociação', 'R$ 48,2 mil', '+18%', true], ['Propostas abertas', '14', '+3', true], ['Conversão', '38%', '+4 p.p.', true], ['Ticket médio', 'R$ 1.840', '+6%', true]]
      : [['Receitas', money.format(15800), '+14%', true], ['Despesas', money.format(9100), '+11%', false], ['A receber', money.format(3100), '4 parcelas', false], ['Saldo do mês', money.format(6700), '+19%', true]];

  const W = 560, H = 170;
  const chart = area === 0
    ? null
    : area === 1 ? chartPath(series.sales, W, H, 48) : chartPath(series.revenue, W, H, 18);
  const costs = area === 2 ? chartPath(series.costs, W, H, 18) : null;
  const labels = area === 0 ? weeks : months;
  const hoverValue = (i: number) => area === 0
    ? `${series.clients[i]} ${t('novos clientes')}`
    : area === 1 ? `R$ ${series.sales[i].toFixed(1).replace('.', ',')} mil` : `${money.format(series.revenue[i] * 1000)} · ${money.format(series.costs[i] * 1000)}`;

  return <div ref={rootRef} className={styles.preview} data-management-preview data-visible={visible || undefined}>
    <div className={styles.top}>
      <span className={styles.brand}>controle<span> · ezway</span></span>
      <span className={styles.search} aria-hidden="true"><Search size={14} />{t('Buscar cliente, venda…')}</span>
      <span className={styles.topRight}>
        <span className={styles.period}><CalendarDays size={14} aria-hidden="true" />{t('Novembro')} 2026</span>
        <span className={styles.bell} aria-hidden="true"><Bell size={15} /><i /></span>
        <span className={styles.me} aria-hidden="true">AL</span>
      </span>
    </div>
    <div className={styles.workspace}>
      <nav className={styles.tabs} aria-label={t('Explorar a demonstração de gestão')}>
        {areas.map(({ label, icon: Icon }, index) => <button type="button" key={label} aria-pressed={area === index} aria-controls="management-preview-panel" onClick={() => { setArea(index); setHover(null); }}><Icon size={17} aria-hidden="true" /><span>{t(label)}</span></button>)}
        <p className={styles.demoTag}>{t('Demonstração ilustrativa')}</p>
      </nav>
      <div id="management-preview-panel" className={styles.panel} role="region" aria-label={t(areas[area].label)}>
        <header className={styles.panelHead}>
          <div><p>{t('Seu negócio em perspectiva')}</p><h3 data-heading-static>{t(area === 0 ? 'Cada cliente, com contexto.' : area === 1 ? 'O próximo passo está à vista.' : 'Entradas e saídas, organizadas.')}</h3></div>
          <span className={styles.live}><i aria-hidden="true" />{t('Atualizado agora')}</span>
        </header>

        <div key={area} className={styles.content}>
          <dl className={styles.kpis}>
            {kpis.map(([label, value, delta, up], i) => <div key={String(label)} style={{ ['--i' as string]: i }}>
              <dt>{t(String(label))}</dt>
              <dd>{String(value)}</dd>
              <span className={styles.delta} data-up={up ? 'true' : 'false'}>{up ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />}{t(String(delta))}</span>
            </div>)}
          </dl>

          <div className={styles.grid}>
            <figure className={styles.chartCard} onMouseLeave={() => setHover(null)}>
              <figcaption>
                <strong>{t(area === 0 ? 'Novos clientes por semana' : area === 1 ? 'Vendas por mês' : 'Receitas x despesas')}</strong>
                {area === 2 && <span className={styles.legend}><i data-tone="in" />{t('Receitas')}<i data-tone="out" />{t('Despesas')}</span>}
                {hover !== null && <span className={styles.readout} aria-live="polite">{labels[hover]} · {hoverValue(hover)}</span>}
              </figcaption>
              <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label={t(area === 0 ? 'Gráfico de novos clientes por semana' : area === 1 ? 'Gráfico de vendas por mês' : 'Gráfico de receitas e despesas por mês')} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`g${gradientId}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff3f9f" stopOpacity=".42" /><stop offset="1" stopColor="#ff3f9f" stopOpacity="0" /></linearGradient>
                  <linearGradient id={`b${gradientId}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9fe9a" /><stop offset="1" stopColor="#7fae45" /></linearGradient>
                </defs>
                {[.25, .5, .75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className={styles.gridLine} />)}
                {area === 0 ? series.clients.map((v, i) => {
                  const bw = 34, gap = (W - bw * series.clients.length) / (series.clients.length + 1);
                  const x = gap + i * (bw + gap), bh = (v / 36) * (H - 14);
                  return <rect key={i} x={x} y={H - bh} width={bw} height={bh} rx="7" fill={`url(#b${gradientId})`} className={styles.bar} style={{ ['--i' as string]: i }} data-active={hover === i || undefined} onMouseEnter={() => setHover(i)} />;
                }) : chart && <>
                  <path d={chart.area} fill={`url(#g${gradientId})`} className={styles.area} />
                  {costs && <path d={costs.d} className={styles.lineAlt} pathLength={1} />}
                  <path d={chart.d} className={styles.line} pathLength={1} />
                  {chart.pts.map(([x, y], i) => <g key={i} onMouseEnter={() => setHover(i)}>
                    <rect x={x - W / 12} y="0" width={W / 6} height={H} fill="transparent" />
                    <circle cx={x} cy={y} r={hover === i ? 6 : 3.5} className={styles.point} />
                  </g>)}
                </>}
              </svg>
              <div className={styles.axis} aria-hidden="true">{labels.map(l => <span key={l}>{t(l)}</span>)}</div>
            </figure>

            <div className={styles.listCard}>
              {area === 0 ? <>
                <p className={styles.listTitle}>{t('Próximos retornos')}</p>
                <ul className={styles.clientList}>{clientRows.map(row => <li key={row.name}>
                  <span className={styles.avatar} data-tone={row.tone} aria-hidden="true">{row.name[0]}</span>
                  <span className={styles.who}><strong>{row.name}</strong><small>{t(row.segment)}</small></span>
                  <span className={styles.next}><span>{t(row.next)}</span><small>{t(row.when)}</small></span>
                </li>)}</ul>
              </> : area === 1 ? <>
                <p className={styles.listTitle}>{t('Funil de vendas')}</p>
                <div className={styles.pipeline}>{pipeline.map(col => <div key={col.stage}>
                  <h4><span className={styles.dot} data-tone={col.tone} />{t(col.stage)}<b>{col.cards.length}</b></h4>
                  {col.cards.map(([name, value]) => <div className={styles.opportunity} key={name}><strong>{name}</strong><span>{value}</span></div>)}
                </div>)}</div>
              </> : <>
                <p className={styles.listTitle}>{t('Lançamentos recentes')}</p>
                <ul className={styles.ledger}>{ledger.map(row => <li key={row.label} data-kind={row.kind}>
                  <span className={styles.ledgerIcon} aria-hidden="true">{row.kind === 'out' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}</span>
                  <span className={styles.who}><strong>{t(row.label)}</strong><small>{row.date}{row.kind === 'pending' ? ` · ${t('a receber')}` : ''}</small></span>
                  <span className={styles.amount}>{row.kind === 'out' ? '−' : '+'}{money.format(row.value)}</span>
                </li>)}</ul>
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={styles.toast} key={toast} aria-hidden="true">
      <span className={styles.toastDot} />
      <span><strong>{t(toasts[toast][0])}</strong><small>{t(toasts[toast][1])}</small></span>
    </div>
    <div className={styles.bottom}><span>{t('Clientes, vendas e financeiro')}</span><span>{t('Dados fictícios')}</span></div>
  </div>;
}
