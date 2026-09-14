'use client';

import { motion, useInView, useAnimation } from 'framer-motion';
import { useRef, useEffect } from 'react';

type SplitType = 'words' | 'characters' | 'lines';

interface SlideUpTextProps {
  children: React.ReactNode;
  split?: SplitType;
  delay?: number;
  stagger?: number;
  from?: 'first' | 'last' | 'center';
  transition?: { type: string; ease?: number[]; duration?: number };
  autoStart?: boolean;
  className?: string;
  wordClass?: string;
  charClass?: string;
  onStart?: () => void;
  onComplete?: () => void;
  inView?: boolean;
}

function splitText(text: string, split: SplitType): string[] {
  switch (split) {
    case 'words':
      return text.split(/(\s+)/).filter(s => s.length > 0);
    case 'characters':
      return text.split('');
    case 'lines':
      return text.split('\n');
    default:
      return [text];
  }
}

export function SlideUpText({
  children,
  split = 'words',
  delay = 0,
  stagger = 0.08,
  from = 'first',
  transition = { type: 'tween', ease: [0.625, 0.05, 0, 1], duration: 0.6 },
  autoStart = true,
  className = '',
  wordClass = '',
  charClass = '',
  onStart,
  onComplete,
  inView = false
}: SlideUpTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView || (autoStart && !inView)) {
      controls.start('visible');
      onStart?.();
    } else if (inView && isInView) {
      controls.start('visible');
      onStart?.();
    }
  }, [inView, isInView, autoStart, controls, onStart]);

  const textContent = typeof children === 'string' ? children : String(children);
  const items = splitText(textContent, split);

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...transition,
        stagger: {
          each: stagger,
          from: from === 'first' ? 0 : from === 'last' ? items.length - 1 : items.length / 2
        }
      }
    }
  };

  const itemTransition = {
    ...transition,
    delay: delay
  };

  return (
    <div ref={ref} className={className} style={{ display: 'inline-block' }}>
      {items.map((item, index) => {
        const isSpace = split === 'words' && /^\s+$/.test(item);
        const classNames = [
          split === 'words' ? wordClass : split === 'characters' ? charClass : '',
          isSpace ? 'whitespace-pre' : ''
        ].filter(Boolean).join(' ');

        return (
          <motion.span
            key={index}
            className={classNames}
            style={{ display: split === 'words' || split === 'characters' ? 'inline-block' : 'block' }}
            initial="hidden"
            animate={controls}
            variants={variants}
            transition={itemTransition}
            onAnimationComplete={index === items.length - 1 ? onComplete : undefined}
          >
            {item}
          </motion.span>
        );
      })}
    </div>
  );
}