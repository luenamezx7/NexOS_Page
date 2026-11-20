'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { motionEase, motionTiming } from '@/lib/motion-presets';
import { useScrollLock } from '../useScrollLock';
import { openDialogSurface, closeDialogSurface } from '@/lib/dialog-transition';
import { ResizeTransition } from '../ui/resize-transition';
import styles from './ManagementSimulation.module.css';

const chapters = ['Comercial', 'Clientes', 'Financeiro'];
const opportunities = ['Padaria Horizonte', 'Estúdio Ipê'];
const stages = ['Novo contato', 'Em conversa', 'Proposta', 'Retentativas'];
const clients = [
  { name: 'Ateliê Aurora', history: ['Primeira conversa sobre o projeto.', 'Proposta revisada com o cliente.', 'Próximo passo: alinhar a entrega.'] },
  { name: 'Café Jardim', history: ['Contato inicial recebido.', 'Necessidades do negócio conversadas.', 'Próximo passo: apresentar uma proposta.'] },
];
const periods = [
  { label: 'Novembro', revenue: 12400, costs: 7600, pending: 2300 },
  { label: 'Dezembro', revenue: 15800, costs: 9100, pending: 3100 },
  { label: 'Janeiro', revenue: 11000, costs: 6800, pending: 1500 },
];

function DemoContent({ chapter }: { chapter: number }) {
  const { t, locale } = useLocale();
  const reduced = usePrefersReducedMotion();
  const [opportunity, setOpportunity] = useState(0);
  const [selectedStages, setSelectedStages] = useState([0, 1]);
  const [returns, setReturns] = useState(['2026-11-20', '2026-11-23']);
  const [client, setClient] = useState(0);
  const [period, setPeriod] = useState(0);
  const currency = (value: number) => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  const selection = chapter === 0 ? opportunity : chapter === 1 ? client : period;
  const selectionLabel = t(chapter === 0 ? 'Oportunidade' : chapter === 1 ? 'Cliente' : 'Período');
  return <div className={styles.content}>
    <label className={styles.field}>{selectionLabel}
      <select aria-label={selectionLabel} value={selection} onChange={event => {
        const value = Number(event.target.value);
        if (chapter === 0) setOpportunity(value);
        else if (chapter === 1) setClient(value);
        else setPeriod(value);
      }}>
        {(chapter === 0 ? opportunities : chapter === 1 ? clients.map(item => item.name) : periods.map(item => t(item.label))).map((label, index) => <option key={label} value={index}>{label}</option>)}
      </select>
    </label>
    <motion.div key={`${chapter}-${selection}`} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : motionTiming.selection, ease: motionEase }} className={styles.panel}>
      {chapter === 0 ? <>
        <p className={styles.kicker}>{t('Acompanhe o próximo passo')}</p>
        <h3 data-heading-static>{opportunities[opportunity]}</h3>
        <div className={styles.fields}>
          <label className={styles.field}>{t('Etapa da oportunidade')}<select value={selectedStages[opportunity]} onChange={event => setSelectedStages(values => values.map((value, index) => index === opportunity ? Number(event.target.value) : value))}>{stages.map((stage, index) => <option key={stage} value={index}>{t(stage)}</option>)}</select></label>
          <label className={styles.field}>{t('Próximo retorno')}<input type="date" value={returns[opportunity]} onChange={event => setReturns(values => values.map((value, index) => index === opportunity ? event.target.value : value))} /></label>
        </div>
        <p className={styles.status} role="status">{t('Etapa atual:')} <strong>{t(stages[selectedStages[opportunity]])}</strong></p>
        <p className={styles.muted}>{t('As alterações ficam apenas neste navegador.')}</p>
      </> : chapter === 1 ? <>
        <p className={styles.kicker}>{t('Histórico de relacionamento')}</p>
        <h3 data-heading-static>{clients[client].name}</h3>
        <ol className={styles.history}>{clients[client].history.map((entry, index) => <li key={entry}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{t(entry)}</p></li>)}</ol>
      </> : <>
        <p className={styles.kicker}>{t('Visão financeira')}</p>
        <h3 data-heading-static>{t(periods[period].label)}</h3>
        <dl className={styles.metrics}>
          {[[t('Receitas'), periods[period].revenue], [t('Custos'), periods[period].costs], [t('A receber'), periods[period].pending]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{currency(Number(value))}</dd></div>)}
        </dl>
        <p className={styles.muted}>{t('Acompanhe receitas, custos e valores a receber por período.')}</p>
      </>}
    </motion.div>
  </div>;
}

export default function ManagementSimulation({ initialChapter, onDismiss }: { initialChapter: number; onDismiss: () => void }) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const [chapter, setChapter] = useState(initialChapter);
  const [revision, setRevision] = useState(0);
  useScrollLock(true);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    openDialogSurface(dialog);
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  const close = () => {
    if (closing.current || !dialogRef.current) return;
    closing.current = true;
    void closeDialogSurface(dialogRef.current).then(onDismiss);
  };
  return <dialog ref={dialogRef} className={`${styles.dialog} t-modal`} aria-labelledby="management-simulation-title" aria-describedby="management-simulation-notice" data-management-simulation data-lenis-prevent onCancel={event => { event.preventDefault(); close(); }}>
    <header className={styles.header}>
      <div><p className={styles.badge}>{t('Gestão')}</p><h2 id="management-simulation-title" data-heading-static>{t('Explore a gestão')}</h2></div>
      <button type="button" className={styles.close} onClick={close} aria-label={t('Fechar gestão')}><X size={20} aria-hidden="true" /></button>
    </header>
    <p id="management-simulation-notice" className={styles.notice}>{t('Nenhuma informação é enviada ao CRM.')}</p>
    <div className={styles.tabs} aria-label={t('Área da gestão')}>{chapters.map((label, index) => <button type="button" key={label} aria-pressed={chapter === index} onClick={() => setChapter(index)}>{t(label)}</button>)}</div>
    <ResizeTransition><DemoContent chapter={chapter} key={revision} /></ResizeTransition>
    <div className={styles.footer}><button type="button" className={styles.reset} onClick={() => setRevision(value => value + 1)}><RotateCcw size={16} aria-hidden="true" />{t('Reiniciar')}</button><span>{t('Sem conexão com seus dados reais')}</span></div>
  </dialog>;
}
