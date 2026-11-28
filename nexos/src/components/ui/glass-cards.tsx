'use client';

import { scheduleScrollRefresh } from '@/lib/schedule-scroll-refresh';

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { usePresentationGate } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { useScrollContext } from '../SmoothScrollProvider';
import styles from './glass-cards.module.css';
import { createStableViewport } from '@/lib/scroll-profile';
import { useNativeReducedMotion } from '@/lib/use-native-reduced-motion';
import { createCardStory } from '../sections/ecosystem-card-motion';

export interface GlassCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  ink?: string;
  accent?: string;
  badge?: string;
  children?: ReactNode;
}

/** Adapted from the supplied stacking-glass example; owns only this scene's GSAP context. */
export function StackedCards({ items, stageRef }: { items: GlassCardData[]; stageRef: RefObject<HTMLDivElement | null> }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const presenting = usePresentationGate();
  const reduced = useNativeReducedMotion();
  const { lenis } = useScrollContext();
  const contentKey = items.map(item => `${item.id}:${item.title}:${item.description}`).join('|');
  useEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    if (!stage || !viewport || presenting || reduced) return;
    let disposed = false;
    let revert = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      revert = () => media.revert();
      media.add('(min-width: 0px)', () => {
        const cards = [...viewport.querySelectorAll<HTMLElement>('[data-glass-card]')];
        if (!cards.length) return;
        stage.dataset.scrollCards = 'true';
        viewport.dataset.stacked = 'true';
        const viewportSize = createStableViewport();
        const clearance = () => Math.min(110, Math.max(80, Math.round(viewportSize().height * .25)));
        const peek = () => Math.min(6, viewport.clientHeight * .02);
        const fit = () => {
          const headingHeight = viewport.getBoundingClientRect().top - stage.getBoundingClientRect().top;
          const height = Math.max(140, Math.floor(viewportSize().height - clearance() - headingHeight - 24));
          stage.style.setProperty('--chapter-height', `${height}px`);
          stage.style.setProperty('--stack-offset', `${Math.min(6, height * .02) * (cards.length - 1)}px`);
        };
        fit();
        cards.forEach((card, index) => gsap.set(card, { y: index ? viewport.clientHeight + 24 : 0, scale: 1, transformOrigin: 'center top' }));
        let active = -1;
        const activationTimes = [0];
        const arrivals = [0];
        const timeline = gsap.timeline({
          scrollTrigger: {
            id: 'ecosystem-cards', trigger: stage, pin: stage,
            // Async effects and breakpoint changes can create upstream pins later.
            refreshPriority: 1,
            start: () => `top ${clearance()}px`,
            end: () => `+=${Math.round(Math.max((viewportSize().height - clearance()) * 1.8, viewport.clientHeight * Math.max(1, cards.length - 1) * .9))}`,
            scrub: .65, invalidateOnRefresh: true, anticipatePin: 1, onRefreshInit: fit,
            onRefresh(trigger) {
              stage.dataset.stackStart = String(trigger.start);
              stage.dataset.stackEnd = String(trigger.end);
            },
          },
          onUpdate() {
            let next = 0;
            activationTimes.forEach((time, index) => { if (this.time() >= time) next = index; });
            if (next === active) return;
            active = next;
            cards.forEach((card, index) => { card.dataset.active = String(index === active); });
          },
        });
        timeline.addLabel('card-0', 0).to({}, { duration: 1.5 });
        for (let index = 1; index < cards.length; index++) {
          const start = 1.5 + (index - 1) * 1.9;
          arrivals.push(start + .45);
          activationTimes.push(start + .55);
          timeline.fromTo(cards[index], { y: () => viewport.clientHeight + 24 }, { y: () => index * peek(), duration: .8, ease: 'none', immediateRender: false }, start);
          cards.slice(0, index).forEach((card, older) => timeline.fromTo(card,
            { scale: Math.max(.78, 1 - (index - older - 1) * .04) },
            { scale: Math.max(.78, 1 - (index - older) * .04), duration: .8, ease: 'none', immediateRender: false }, start));
          timeline.addLabel(`card-${index}`, start + 1.75);
        }
        // The first card builds itself while the section scrolls into view, so it
        // never arrives empty at the pin; the others build as they arrive.
        gsap.timeline({ scrollTrigger: { id: 'ecosystem-first-card', trigger: stage, start: 'top 85%', end: () => `top ${clearance()}px`, scrub: .6, invalidateOnRefresh: true } })
          .add(createCardStory(gsap, cards[0], cards[0].dataset.solution!));
        cards.slice(1).forEach((card, index) => {
          timeline.add(createCardStory(gsap, card, card.dataset.solution!), arrivals[index + 1]);
        });
        timeline.to({}, { duration: .25 });
        timeline.addLabel('card-0', 1.35);
        cards.forEach((card, index) => { card.dataset.stackProgress = String(timeline.labels[`card-${index}`] / timeline.duration()); });
        cards[0].dataset.active = 'true';
        const revealFocus = (event: FocusEvent) => {
          const card = (event.target as HTMLElement).closest<HTMLElement>('[data-glass-card]');
          const index = card ? cards.indexOf(card) : -1;
          if (index < 0) return;
          viewport.scrollTop = 0;
          if (card!.dataset.active === 'true') return;
          const progress = timeline.labels[`card-${index}`] / timeline.duration();
          const trigger = timeline.scrollTrigger!;
          const target = trigger.start + (trigger.end - trigger.start) * progress;
          if (lenis) lenis.scrollTo(target, { immediate: true });
          else window.scrollTo({ top: target, behavior: 'instant' });
          trigger.getTween()?.progress(1);
          timeline.progress(progress);
        };
        stage.addEventListener('focusin', revealFocus);
        const near = new IntersectionObserver(([entry]) => { viewport.dataset.stackNear = String(entry.isIntersecting); }, { rootMargin: '50% 0px' });
        near.observe(stage);
        return () => {
          near.disconnect();
          delete viewport.dataset.stackNear;
          stage.removeEventListener('focusin', revealFocus);
          viewport.scrollTop = 0;
          cards.forEach(card => { card.style.removeProperty('transform'); delete card.dataset.active; delete card.dataset.stackProgress; });
          stage.style.removeProperty('--chapter-height');
          stage.style.removeProperty('--stack-offset');
          delete stage.dataset.scrollCards;
          delete stage.dataset.stackStart; delete stage.dataset.stackEnd;
          delete viewport.dataset.stacked;
        };
      }, stage);
      scheduleScrollRefresh(ScrollTrigger);
    }).catch(error => { revert(); recordMotion('glassCards', 'initialization-error', motionError(error)); });
    return () => { disposed = true; revert(); };
  }, [items.length, contentKey, lenis, presenting, reduced, stageRef]);

  return <div ref={viewportRef} className={styles.viewport} data-ecosystem-viewport data-stack-reduced={reduced}>
    <div className={styles.stack} data-ecosystem-track>
      {items.map((item, index) => <article tabIndex={0} aria-label={item.title} key={item.id} data-glass-card data-glass-dark={Boolean(item.ink) || undefined} data-solution={item.id} className={styles.card} style={{ '--glass-color': item.color, '--glass-ink': item.ink ?? '#19171c', '--glass-accent': item.accent ?? 'currentColor', '--glass-order': index } as CSSProperties}>
        <div className={styles.surface}>
          <div className={styles.content} data-glass-copy>
            <div className={styles.intro} data-card-intro>
              <span className={styles.eyebrow} data-card-reveal><span className={styles.eyebrowDot} aria-hidden="true" />{item.category}<span className={styles.eyebrowIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span></span>
              {item.badge && <span className={styles.badge} data-card-reveal>{item.badge}</span>}
              <h3 data-heading-static aria-label={item.title}>{item.title.split(' ').map((word, wordIndex) => <span key={wordIndex} className={styles.titleWord} aria-hidden="true"><span data-card-reveal>{word}</span>{' '}</span>)}</h3>
              <p data-card-reveal>{item.description}</p>
            </div>
            {item.children && <div className={styles.details} data-card-visual>{item.children}</div>}
          </div>
        </div>
      </article>)}
    </div>
  </div>;
}
