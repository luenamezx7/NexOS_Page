"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = (func: (...args: unknown[]) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const TextPressure: React.FC<TextPressureProps> = ({
  text = 'NEXOS, A PERFORMANCE QUE SEU BUSINESS MERECE.',
  fontFamily = 'Geist',
  fontUrl = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap',
  width = true,
  weight = true,
  italic = false,
  alpha = false,
  stroke = false,
  scale = false,
  textColor = '#FFFFFF',
  strokeColor = '#FFFFFF',
  className = '',
  minFontSize = 32,
  maxFontSize = 96,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(minFontSize);
  const fontSizeRef = useRef(minFontSize);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.2);

  // Split text into words, preserving spaces as separate items
  const words = useMemo(() => {
    const parts = text.split(/(\s+)/);
    return parts.filter(p => p.length > 0).map((part, i) => ({
      id: i,
      text: part,
      isSpace: part.match(/^\s+$/),
    }));
  }, [text]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      cursorRef.current.x = t.clientX;
      cursorRef.current.y = t.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    if (containerRef.current) {
      const { left, top, width: w, height: h } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + w / 2;
      mouseRef.current.y = top + h / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();

    // Calculate font size based on container width and text length
    const avgWordLength = words.reduce((sum, w) => sum + w.text.length, 0) / words.length;
    const estimatedCharsPerLine = containerW / (fontSizeRef.current * 0.6);
    const estimatedLines = Math.ceil(words.length / Math.max(1, estimatedCharsPerLine / avgWordLength));
    
    let newFontSize = containerW / (words.length / 3.5);
    newFontSize = Math.max(newFontSize, minFontSize);
    newFontSize = Math.min(newFontSize, maxFontSize);

    // Adjust for multiple lines
    if (estimatedLines > 1) {
      newFontSize = newFontSize / Math.sqrt(estimatedLines);
      newFontSize = Math.max(newFontSize, minFontSize);
    }

    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1.2);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();

      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(Math.min(yRatio, 1.5));
        setLineHeight(1.2 * Math.min(yRatio, 1.5));
      }
    });
  }, [words, minFontSize, maxFontSize, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener('resize', debouncedSetSize);
    return () => window.removeEventListener('resize', debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId: number;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 12;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 12;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = Math.max(titleRect.width, titleRect.height) / 1.5;

        spansRef.current.forEach(span => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };

          const d = dist(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(getAttr(d, maxDist, 25, 150)) : 100;
          const wght = weight ? Math.floor(getAttr(d, maxDist, 200, 800)) : 400;
          const italVal = italic ? getAttr(d, maxDist, 0, 0.5).toFixed(2) : '0';
          const alphaVal = alpha ? getAttr(d, maxDist, 0.3, 1).toFixed(2) : '1';

          const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newFontVariationSettings) {
            span.style.fontVariationSettings = newFontVariationSettings;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha]);

  const styleElement = useMemo(() => {
    return (
      <style>{`
        ${fontUrl ? `@import url('${fontUrl}');` : ''}

        .text-pressure-title {
          color: ${textColor};
        }

        .stroke span {
          position: relative;
          color: ${textColor};
        }
        .stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: 2px;
          -webkit-text-stroke-color: ${strokeColor};
        }
      `}</style>
    );
  }, [fontUrl, textColor, strokeColor]);

  const dynamicClassName = [className, stroke ? 'stroke' : ''].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        height: '100%',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        overflow: 'hidden',
        padding: '0 1rem',
        boxSizing: 'border-box',
      }}
    >
      {styleElement}
      <h1
        ref={titleRef}
        className={`text-pressure-title ${dynamicClassName}`}
        style={{
          fontFamily,
          textTransform: 'uppercase',
          fontSize: fontSize,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: 'center center',
          margin: 0,
          textAlign: 'center',
          userSelect: 'none',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          fontWeight: 100,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {words.map((word) => (
          <span
            key={word.id}
            ref={el => {
              spansRef.current[word.id] = el;
            }}
            data-char={word.text}
            style={{
              display: 'inline-block',
              color: stroke ? undefined : textColor,
              willChange: 'font-variation-settings, opacity',
              fontVariationSettings: "'wght' 400, 'wdth' 100, 'ital' 0",
              whiteSpace: word.isSpace ? 'pre' : 'nowrap',
            }}
          >
            {word.text}
          </span>
        ))}
      </h1>
    </div>
  );
};

export default TextPressure;