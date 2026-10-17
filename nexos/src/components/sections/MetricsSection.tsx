'use client';

import { useId, useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ArrowUpRight, Activity } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field';
import { DEMO_METRICS } from './landing-content';
import styles from './Sections.module.css';

export function MetricsSection() {
  const [period, setPeriod] = useState<keyof typeof DEMO_METRICS>('month');
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const data = DEMO_METRICS[period];
  const points = data.values.map((value, i) => `${20 + i * 50},${190 - value * 1.65}`);
  const line = `M${points.join(' L')}`;

  return <section id="metrics" aria-labelledby="metrics-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.eyebrow}><span>02 / DADOS & SINAIS</span><span>PRÉVIA DEMONSTRATIVA</span></div>
      <header className={styles.splitHeader}>
        <h2 id="metrics-title" className={styles.heading}>Cada interação.<br /><span>Um novo sinal.</span></h2>
        <div><p className={styles.lead}>Uma visão do que pode ser acompanhado no digital. Esta composição usa dados fictícios para demonstrar os gráficos.</p><p className={styles.demoNote}>DADOS ILUSTRATIVOS · NÃO REPRESENTAM RESULTADOS DA NEXOS</p></div>
      </header>
      <div className={styles.metricsGrid}>
        <article className={styles.chartPanel}>
          <div className={styles.chartTop}><span><Activity size={16} aria-hidden="true" /> Interações no período</span>
            <FieldSet><FieldLegend className="sr-only">Período do gráfico demonstrativo</FieldLegend><FieldGroup className={styles.segmented}>
              {(Object.keys(DEMO_METRICS) as (keyof typeof DEMO_METRICS)[]).map(key => <label key={key} data-selected={period === key}><input type="radio" name="metric-period" checked={period === key} onChange={() => setPeriod(key)} />{DEMO_METRICS[key].label}</label>)}
            </FieldGroup></FieldSet>
          </div>
          <div className={styles.chartValue} aria-live="polite"><strong>{data.total}</strong><span>{data.change} <ArrowUpRight size={16} aria-hidden="true" /><small>variação simulada</small></span></div>
          <svg key={period} className={styles.lineChart} viewBox="0 0 590 220" role="img" aria-label={`Gráfico demonstrativo de interações em ${data.label}`}>
            <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".22" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
            {[30, 80, 130, 180].map(y => <line key={y} x1="20" x2="570" y1={y} y2={y} className={styles.chartGridLine} />)}
            <path d={`${line} L570,200 L20,200 Z`} fill={`url(#${id}-fill)`} />
            <motion.path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: 'easeOut' }} />
            <circle cx="570" cy={190 - data.values.at(-1)! * 1.65} r="4" fill="currentColor" />
            <text x="20" y="218">INÍCIO</text><text x="570" y="218" textAnchor="end">{data.label.toUpperCase()}</text>
          </svg>
          <span className={styles.chartFoot}>01 / EVOLUÇÃO DAS INTERAÇÕES</span>
        </article>
        <article className={styles.channelPanel}>
          <span className={styles.monoLabel}>02 / ORIGEM DOS ACESSOS</span>
          <h3>Mais de um caminho.<br />O mesmo destino.</h3>
          <div className={styles.channels}>{[{ label: 'NFC', value: 62 }, { label: 'QR Code', value: 28 }, { label: 'Link direto', value: 10 }].map(item => <div key={item.label}>
            <div className={styles.channelLabel}><span>{item.label}</span><span>{item.value}%</span></div>
            <div className={styles.barTrack}><motion.div initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ width: `${item.value}%` }} /></div>
          </div>)}</div>
          <p className={styles.demoNote}>Distribuição fictícia para visualização.</p>
        </article>
      </div>
    </div>
  </section>;
}
