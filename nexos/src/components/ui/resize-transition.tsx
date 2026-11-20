'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Measure intrinsic content so the official height tween can animate auto-sized cards. */
export function ResizeTransition({ children, overflow = 'clip' }: { children: ReactNode; overflow?: 'clip' | 'visible' }) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.blockSize ?? element.getBoundingClientRect().height;
      setHeight(previous => previous === next ? previous : next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="t-resize" data-resize-transition style={{ height, overflow }}>
    <div ref={content} style={{ display: 'flow-root' }}>{children}</div>
  </div>;
}
