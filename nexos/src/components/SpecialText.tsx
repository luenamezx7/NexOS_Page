'use client';

import { useEffect, useRef, useState } from 'react';

interface SpecialTextProps {
  children: string;
  speed?: number;
  delay?: number;
  className?: string;
  inView?: boolean;
}

export function SpecialText({
  children,
  speed = 80,
  delay = 0,
  className = '',
  inView = false
}: SpecialTextProps) {
  const [visible, setVisible] = useState(!inView);
  const [animatedText, setAnimatedText] = useState('');
  const ref = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const textRef = useRef<string>(children);

  useEffect(() => {
    textRef.current = children;
  }, [children]);

  useEffect(() => {
    if (inView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [inView]);

  useEffect(() => {
    if (!visible) {
      indexRef.current = 0;
      return;
    }

    const animate = () => {
      const currentText = textRef.current;
      if (indexRef.current <= currentText.length) {
        setAnimatedText(currentText.slice(0, indexRef.current));
        indexRef.current++;
        timeoutRef.current = window.setTimeout(animate, speed);
      }
    };

    const initialTimeoutId = window.setTimeout(() => {
      animate();
    }, delay * 1000);

    return () => {
      clearTimeout(initialTimeoutId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, delay, speed]);

  useEffect(() => {
    if (!visible) {
      indexRef.current = 0;
    }
  }, [visible]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      {visible ? animatedText : ''}
    </span>
  );
}