'use client';

import { motion, useInView, useAnimation, type Variants, type Transition } from 'framer-motion';
import { useRef, useEffect } from 'react';

type SplitType = 'words' | 'characters' | 'lines';

interface SlideUpTextProps {
  children: React.ReactNode;
  split?: SplitType;
  delay?: number;
  stagger?: number;
  from?: 'first' | 'last' | 'center';
  transition?: Transition;
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
  transition,
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

  const containerVariantsWithStagger: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
        ...(transition as object)
      }
    }
  };

  const itemVariantsWithTransition: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'tween',
        ease: [0.625, 0.05, 0, 1],
        duration: 0.6,
        ...(transition as object)
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ display: 'inline-block' }}
      initial="hidden"
      animate={controls}
      variants={containerVariantsWithStagger}
    >
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
            variants={itemVariantsWithTransition}
            onAnimationComplete={index === items.length - 1 ? onComplete : undefined}
          >
            {item}
          </motion.span>
        );
      })}
    </motion.div>
  );
}