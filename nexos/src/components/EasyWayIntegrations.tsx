'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AtSign, Globe, Headphones, LayoutDashboard, MessageCircle, Nfc, Star, UtensilsCrossed } from 'lucide-react';
import styles from './EasyWayIntegrations.module.css';
import { useLocale } from '@/lib/locale';

/* Geometry lives in a 400 × 400 box; nodes are placed with the same numbers as
   percentages, so the SVG links and the HTML nodes always line up. */
const C = 200;
const NODES = [
  { id: 'instagram', label: 'Instagram', icon: AtSign, href: '#mini-sites', r: 108, a: -135, tone: 'pink' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: '#easychat', r: 108, a: -45, tone: 'lime' },
  { id: 'google', label: 'Google', icon: Star, href: '#showcase', r: 108, a: 45, tone: 'violet' },
  { id: 'placa', label: 'Placa NFC', icon: Nfc, href: '#showcase', r: 108, a: 135, tone: 'pink' },
  { id: 'site', label: 'Site', icon: Globe, href: '#services', r: 172, a: -90, tone: 'violet' },
  { id: 'cardapio', label: 'Cardápio', icon: UtensilsCrossed, href: '#ecossistema', r: 172, a: 0, tone: 'pink' },
  { id: 'gestao', label: 'Gestão', icon: LayoutDashboard, href: '#gestao', r: 172, a: 90, tone: 'lime' },
  { id: 'atendimento', label: 'Atendimento', icon: Headphones, href: '#cta-final', r: 172, a: 180, tone: 'violet' },
] as const;

const point = (r: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
};
/** A gentle curve from the node into the hub, bowed sideways for a woven look. */
const link = (r: number, a: number, bow: number) => {
  const [x, y] = point(r, a);
  const [mx, my] = point(r * .52, a + bow);
  return `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${C},${C}`;
};

export function EasyWayIntegrations() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setActive(true); return; }
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <figure className={styles.figure} aria-label={t('Pontos do negócio conectados pela ezway')}>
    <div ref={ref} className={styles.diagram} data-integrations data-active={active || undefined} data-hot={hot ?? undefined}>
      <svg className={styles.web} viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <radialGradient id="ezw-core" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ff3f9f" stopOpacity=".55" /><stop offset="1" stopColor="#ff3f9f" stopOpacity="0" /></radialGradient>
          <linearGradient id="ezw-link" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff3f9f" /><stop offset=".5" stopColor="#c9b5f6" /><stop offset="1" stopColor="#b9ef75" /></linearGradient>
        </defs>
        <circle cx={C} cy={C} r="150" fill="url(#ezw-core)" className={styles.aura} />
        <g className={styles.orbitA}><circle cx={C} cy={C} r="108" className={styles.orbit} /></g>
        <g className={styles.orbitB}><circle cx={C} cy={C} r="172" className={styles.orbit} data-outer /></g>
        {/* ring links between neighbours on the same orbit */}
        {NODES.map((n, i) => {
          const next = NODES.find((m, j) => j !== i && m.r === n.r && ((m.a - n.a + 360) % 360) === 90);
          if (!next) return null;
          const [x1, y1] = point(n.r, n.a), [x2, y2] = point(next.r, next.a);
          return <path key={`ring-${n.id}`} d={`M${x1},${y1} A${n.r},${n.r} 0 0 1 ${x2},${y2}`} className={styles.arc} />;
        })}
        {NODES.map((n, i) => <g key={n.id} className={styles.linkGroup} data-node={n.id}>
          <path d={link(n.r, n.a, i % 2 ? 22 : -22)} className={styles.link} />
          <path d={link(n.r, n.a, i % 2 ? 22 : -22)} className={styles.pulse} pathLength={100} style={{ '--d': `${(i * .55) % 4}s` } as CSSProperties} />
        </g>)}
      </svg>

      <div className={styles.center} data-integration-center>
        <span className={styles.ring} aria-hidden="true" /><span className={`${styles.ring} ${styles.ring2}`} aria-hidden="true" />
        <span role="img" aria-label="Logo ezway" className={styles.wordmark}>ez<span className={styles.way} data-brand-way>way</span></span>
      </div>

      <ul className={styles.apps} aria-label={t('Pontos do seu negócio')}>
        {NODES.map(({ id, label, icon: Icon, href, r, a, tone }, i) => {
          const [x, y] = point(r, a);
          return <li key={id} className={styles.app} data-tone={tone} style={{ left: `${x / 4}%`, top: `${y / 4}%`, '--f': `${(i % 4) * -1.3}s` } as CSSProperties}>
            <a href={href} aria-label={t(label)} onPointerEnter={() => setHot(id)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(id)} onBlur={() => setHot(null)}>
              <span className={styles.appIcon} data-integration-node><Icon strokeWidth={1.7} aria-hidden="true" /></span>
              <span className={styles.appLabel}>{t(label)}</span>
            </a>
          </li>;
        })}
      </ul>
    </div>
    <figcaption>{t('Mais caminhos entre seu negócio e seus clientes.')}</figcaption>
  </figure>;
}
