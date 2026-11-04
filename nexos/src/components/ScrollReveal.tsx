'use client';

import { Children, cloneElement, isValidElement, useEffect, useRef, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useLocale } from '@/lib/locale';

function translateChildren(node: ReactNode, t: (text: string) => string): ReactNode {
  return Children.map(node, child => {
    if (typeof child === 'string') {
      const trimmed = child.trim();
      return trimmed ? child.replace(trimmed, t(trimmed)) : child;
    }
    if (!isValidElement(child) || typeof child.type !== 'string') return child;
    const element = child as ReactElement<{ children?: ReactNode }>;
    return cloneElement(element, {}, translateChildren(element.props.children, t));
  });
}

type RevealTag = 'div' | 'span' | 'header' | 'article' | 'section' | 'figure' | 'li' | 'p' | 'h1' | 'h2' | 'h3' | 'nav' | 'aside';
type RevealPreset = 'label' | 'title' | 'body' | 'card' | 'image';

const RECIPES = {
  label: { y: 10, scale: 1, blur: 2, duration: .4 },
  title: { y: 24, scale: 1, blur: 0, duration: .7 },
  body: { y: 14, scale: 1, blur: 0, duration: .55 },
  card: { y: 28, scale: .98, blur: 0, duration: .72 },
  image: { y: 22, scale: 1.035, blur: 0, duration: .85 },
} as const;

interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: RevealTag;
  preset?: RevealPreset;
  delay?: number;
}

/** Progressive enhancement: server HTML is readable; only JS prepares offscreen entries. */
export function ScrollReveal({ children, as = 'div', preset = 'body', delay = 0, ...props }: ScrollRevealProps) {
  const { locale, t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let cancelled = false;
    let started = false;
    let animation: Animation | undefined;
    const recipe = RECIPES[preset];
    const restore = () => {
      for (const property of ['opacity', 'transform', 'filter', 'will-change']) element.style.removeProperty(property);
      element.dataset.revealState = 'visible';
    };
    // Read the preference directly too, before the external-store hydration update.
    if (reduce || matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches || !('IntersectionObserver' in window) || !element.animate) {
      restore();
      return;
    }
    // On the landing, text follows the viewport instead of replaying the one-shot
    // entry. GSAP owns these transforms; cards and images keep the original reveal.
    if (element.closest('.landing-page') && !element.closest('#hero') &&
        ((preset === 'title' && /^H[1-3]$/.test(element.tagName)) || (preset === 'body' && element.tagName === 'P'))) {
      let tween: { kill: () => void; scrollTrigger?: { kill: () => void } } | undefined;
      void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !element.isConnected) return;
        gsap.registerPlugin(ScrollTrigger);
        tween = gsap.fromTo(element,
          { y: preset === 'title' ? 60 : 32, opacity: preset === 'title' ? .35 : .5 },
          { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: element, start: 'top 100%', end: 'top 52%', scrub: .4 } });
      });
      return () => { cancelled = true; tween?.scrollTrigger?.kill(); tween?.kill(); restore(); };
    }
    const bounds = element.getBoundingClientRect();
    // Restored scroll positions and deep links must never hide content already passed.
    if (bounds.bottom < 0 || bounds.top < 96 || element.contains(document.activeElement)) {
      restore();
      return;
    }
    element.style.opacity = '0';
    element.style.transform = `translateY(${recipe.y}px) scale(${recipe.scale})`;
    if (recipe.blur) element.style.filter = `blur(${recipe.blur}px)`;
    element.dataset.revealState = 'pending';

    const reveal = (immediate = false) => {
      if (started && !immediate) return;
      started = true;
      observer.disconnect();
      if (immediate) {
        animation?.cancel();
        restore();
        return;
      }
      element.dataset.revealState = 'entering';
      const mobile = matchMedia('(max-width: 767px)').matches;
      element.style.willChange = recipe.blur ? 'transform, opacity, filter' : 'transform, opacity';
      animation = element.animate([
        { opacity: 0, transform: `translateY(${recipe.y}px) scale(${recipe.scale})`, ...(recipe.blur ? { filter: `blur(${recipe.blur}px)` } : {}) },
        { opacity: 1, transform: 'translateY(0px) scale(1)', ...(recipe.blur ? { filter: 'blur(0px)' } : {}) },
      ], { duration: recipe.duration * 1000, delay: (mobile ? Math.min(delay, .08) : Math.min(delay, .24)) * 1000, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
      void animation.finished.then(() => {
        if (!cancelled) { animation?.cancel(); restore(); }
      }, () => { /* Cancellation on focus, preference change or unmount is expected. */ });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) reveal();
    }, { rootMargin: '0px 0px -36px 0px', threshold: .06 });
    const onFocus = () => reveal(true);
    observer.observe(element);
    element.addEventListener('focusin', onFocus);
    return () => {
      cancelled = true;
      observer.disconnect();
      element.removeEventListener('focusin', onFocus);
      animation?.cancel();
      restore();
    };
  }, [delay, preset, reduce]);

  const Tag = as;
  return <Tag {...props} ref={(node: HTMLElement | null) => { ref.current = node; }} data-reveal={preset} data-reveal-state="visible">{locale === 'en' ? translateChildren(children, t) : children}</Tag>;
}

/** An independent, transform-only decorative layer; never put sticky controls inside. */
export function ScrollFloat({ children, className, distance = 12, direction = 'up' }: { children: ReactNode; className?: string; distance?: number; direction?: 'up' | 'down' }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const visible = useInView(ref, { amount: .05 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const travel = direction === 'up' ? distance : -distance;
  const y = useTransform(scrollYProgress, [0, 1], [travel, -travel]);
  return <motion.div ref={ref} className={className} data-scroll-float data-motion-active={visible && !reduce} style={{ y: reduce ? 0 : y }}>{children}</motion.div>;
}
