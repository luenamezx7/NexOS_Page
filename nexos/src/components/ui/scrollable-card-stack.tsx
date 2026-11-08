'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/locale';
import styles from './scrollable-card-stack.module.css';

export interface StackItem { id: string; title: string; description: string; image: string; alt: string }

/** A card stack with explicit navigation; never consumes the page's wheel/touch scroll. */
export default function ScrollableCardStack({ items, className }: { items: StackItem[]; className?: string }) {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const track = useRef<HTMLUListElement>(null);
  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setActive(next);
    const card = track.current?.children[next] as HTMLElement | undefined;
    if (matchMedia('(max-width: 767px)').matches) card?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', inline: 'center', block: 'nearest' });
  };
  return <div className={cn(styles.stack, className)} role="region" aria-roledescription="carousel" aria-label={t('Soluções ezway')}>
    <ul ref={track} className={styles.track} onScroll={event => {
      if (!matchMedia('(max-width: 767px)').matches) return;
      const children = [...event.currentTarget.children] as HTMLElement[];
      const center = event.currentTarget.scrollLeft + event.currentTarget.clientWidth / 2;
      const nearest = children.reduce((best, card, index) => Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(children[best].offsetLeft + children[best].offsetWidth / 2 - center) ? index : best, 0);
      setActive(nearest);
    }}>
      {items.map((item, i) => <li key={item.id} className={styles.card} data-active={i === active} style={{ '--stack-offset': i - active, '--stack-distance': Math.abs(i - active), '--stack-order': items.length - Math.abs(i - active) } as React.CSSProperties}>
        <div className={styles.image}><Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 84vw, 560px" /></div>
        <div className={styles.cardText}><span>0{i + 1} / 0{items.length}</span><h3>{item.title}</h3><p>{item.description}</p></div>
      </li>)}
    </ul>
    <div className={styles.controls}><button type="button" aria-label={t('Cartão anterior')} onClick={() => goTo(active - 1)} disabled={active === 0}><ArrowLeft size={20} aria-hidden="true" /></button><span aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span><button type="button" aria-label={t('Próximo cartão')} onClick={() => goTo(active + 1)} disabled={active === items.length - 1}><ArrowRight size={20} aria-hidden="true" /></button></div>
  </div>;
}
