'use client';

import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import styles from './Commerce.module.css';

export interface DetailTab {
  id: string;
  label: string;
  title: string;
  description: string;
  items: string[];
}

export function DetailTabs({ id, tabs }: { id: string; tabs: DetailTab[] }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const reduce = useReducedMotion();
  if (!tabs.length) return null;
  return (
    <div className={styles.details}>
      <div role="tablist" aria-label="Detalhes da placa" className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button key={tab.id} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${tab.id}`} aria-controls={`${id}-panel-${tab.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
            if (next === null) return;
            event.preventDefault(); setActive(next); buttons.current[next]?.focus();
          }}>{tab.label}</button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div key={tab.id} role="tabpanel" id={`${id}-panel-${tab.id}`} aria-labelledby={`${id}-tab-${tab.id}`} tabIndex={0} hidden={active !== index}>
          {active === index && <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={styles.detailGrid}>
            <div><h3>{tab.title}</h3><p>{tab.description}</p></div>
            <ul>{tab.items.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          </motion.div>}
        </div>
      ))}
    </div>
  );
}
