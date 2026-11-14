'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale } from '@/lib/locale';
import styles from './RealEstateVideo.module.css';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ScrollReveal } from '../ScrollReveal';

/** Pass a real video URL when approved portfolio footage is available. */
export function RealEstateVideo({ videoSrc, posterSrc = "/ezway-demo-studio.jpg" }: { videoSrc?: string; posterSrc?: string }) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !motionMedia('(prefers-reduced-motion: reduce)').matches) {
        void video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: .35 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      video.pause();
    };
  }, [videoSrc, reduce]);

  return <section className={styles.section} aria-labelledby="real-estate-video-title">
    <div className={styles.inner}>
      <ScrollReveal as="h2" preset="title" id="real-estate-video-title" className={styles.title}>{t('Transpareça a verdadeira qualidade do seu trabalho.')}</ScrollReveal>
      <p className={styles.description}>{t('Vídeos profissionais e imersivos com IA.')}</p>
      <div className={styles.posterWrap} data-video={Boolean(videoSrc)}>
        <div className={styles.poster}>
          {videoSrc ? <video ref={videoRef} src={videoSrc} poster={posterSrc} muted playsInline loop controls preload="metadata" aria-label={t('Vídeo demonstrativo da ezway')} /> :
            <Image src="/ezway-demo-studio.jpg" alt={t('Imagem ilustrativa de um ambiente interno, não uma prévia de vídeo produzido pela ezway')} fill sizes="(max-width: 767px) 100vw, 1080px" className={styles.image} />}
        </div>
      </div>
      {!videoSrc && <p className={styles.disclaimer}>{t('Imagem ilustrativa. Vídeo demonstrativo em preparação.')}</p>}
    </div>
  </section>;
}
