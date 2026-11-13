'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import styles from './TextType.module.css';

/** A small, typed adaptation of React Bits TextType for a single changing word. */
export function TextType({ text, typingSpeed = 75, deletingSpeed = 45, pauseDuration = 3000 }: {
  text: readonly string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(text[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const node = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const media = motionMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!node.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    observer.observe(node.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = cursor.current;
    if (!element || reduced || !visible) return;
    const tween = gsap.to(element, { opacity: 0, duration: .55, ease: 'sine.inOut', repeat: -1, yoyo: true });
    return () => { tween.kill(); gsap.set(element, { clearProps: 'opacity' }); };
  }, [reduced, visible]);

  useEffect(() => {
    if (reduced || !visible || document.hidden || text.length < 2) return;
    const word = text[index] ?? '';
    const timeout = window.setTimeout(() => {
      if (deleting) {
        if (count > 0) setCount(value => value - 1);
        else { setIndex(value => (value + 1) % text.length); setDeleting(false); }
      } else if (count < word.length) setCount(value => value + 1);
      else setDeleting(true);
    }, deleting ? deletingSpeed : count < word.length ? typingSpeed : pauseDuration);
    return () => clearTimeout(timeout);
  }, [count, deleting, deletingSpeed, index, pauseDuration, reduced, text, typingSpeed, visible]);

  return <span ref={node} className={styles.root} aria-hidden="true" data-typing-word>
    <span className={styles.word}>{reduced ? text[0] : (text[index] ?? '').slice(0, count)}</span>
    {!reduced && <span ref={cursor} className={styles.cursor} />}
  </span>;
}
