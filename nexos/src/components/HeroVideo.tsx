'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './HeroVideo.module.css';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';

const labels = {
  pt: ['Pausar vídeo de fundo', 'Retomar vídeo de fundo'],
  en: ['Pause background video', 'Resume background video'],
  es: ['Pausar vídeo de fondo', 'Reanudar vídeo de fondo'],
} as const;

export function HeroVideo({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    // Set both properties before assigning src: iOS checks these for autoplay.
    video.muted = true;
    video.defaultMuted = true;
    const hero = video.closest('#hero');
    const sync = () => {
      if (active && visible && !paused && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        recordMotion('heroVideo', 'play-requested');
        // Load only when the hero is visible; keep the original 1080p file intact.
        if (!video.getAttribute('src')) video.src = '/media/gloved-hand-connecting-iphone.mp4';
        void video.play().catch(error => { setPlaying(false); recordMotion('heroVideo', 'play-rejected', motionError(error)); });
      } else {
        recordMotion('heroVideo', 'paused-by-condition', window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced-motion' : !active ? 'presentation' : !visible ? 'offscreen' : paused ? 'user-paused' : 'document-hidden');
        video.pause();
      }
    };
    const retryOnGesture = (event: Event) => {
      // Controls handle their own gesture; retrying here would toggle twice.
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;
      sync();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    hero?.addEventListener('pointerdown', retryOnGesture, { passive: true });
    video.addEventListener('canplay', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      hero?.removeEventListener('pointerdown', retryOnGesture);
      video.removeEventListener('canplay', sync);
      video.pause();
    };
  }, [active, paused, reduce]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      setPaused(true);
      video.pause();
    } else {
      setPaused(false);
      video.muted = true;
      video.defaultMuted = true;
      if (!video.getAttribute('src')) video.src = '/media/gloved-hand-connecting-iphone.mp4';
      // Keep play() inside the tap handler for browsers that require a gesture.
      recordMotion('heroVideo', 'manual-play-requested');
      void video.play().catch(error => { setPlaying(false); recordMotion('heroVideo', 'play-rejected', motionError(error)); });
    }
  };

  return <>
    <div className={styles.background} data-hero-video aria-hidden="true">
      <video ref={videoRef} className={styles.video} width={1920} height={1080}
        poster="/media/gloved-hand-connecting-iphone-poster.jpg"
        muted playsInline autoPlay={active && !paused && !reduce} loop preload="metadata"
        onPlaying={() => { setPlaying(true); recordMotion('heroVideo', 'playing'); }}
        onPause={() => setPlaying(false)}
        onError={() => recordMotion('heroVideo', 'media-error', `MediaError code=${videoRef.current?.error?.code ?? 'unknown'}`)}
        tabIndex={-1} disablePictureInPicture />
      <div className={styles.shade} />
      <div className={styles.grain} />
    </div>
    <button className={styles.control} type="button" onClick={togglePlayback}
      aria-label={labels[locale][playing ? 0 : 1]} title={labels[locale][playing ? 0 : 1]}>
      {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
    </button>
  </>;
}
