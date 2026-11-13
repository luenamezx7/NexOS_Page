'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './HeroVideo.module.css';

const labels = {
  pt: ['Pausar vídeo de fundo', 'Retomar vídeo de fundo'],
  en: ['Pause background video', 'Resume background video'],
  es: ['Pausar vídeo de fondo', 'Reanudar vídeo de fondo'],
} as const;

export function HeroVideo({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    let disposed = false;
    const sync = () => {
      if (active && visible && !paused && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Load only when the hero is visible; keep the original 1080p file intact.
        if (!video.getAttribute('src')) video.src = '/media/gloved-hand-connecting-iphone.mp4';
        void video.play().then(() => {
          if (disposed) video.pause();
        }).catch(() => { /* The poster remains visible when autoplay is unavailable. */ });
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      video.pause();
    };
  }, [active, paused, reduce]);

  return <>
    <div className={styles.background} data-hero-video aria-hidden="true">
      <video ref={videoRef} className={styles.video} width={1920} height={1080}
        poster="/media/gloved-hand-connecting-iphone-poster.jpg"
        muted playsInline loop preload="none" tabIndex={-1} disablePictureInPicture />
      <div className={styles.shade} />
      <div className={styles.grain} />
    </div>
    <button className={styles.control} type="button" onClick={() => setPaused(value => !value)}
      aria-label={labels[locale][paused ? 1 : 0]} title={labels[locale][paused ? 1 : 0]}>
      {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
    </button>
  </>;
}
