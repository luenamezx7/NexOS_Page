'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale } from '@/lib/locale';
import styles from './RealEstateVideo.module.css';

/** Pass a real video URL when approved portfolio footage is available. */
export function RealEstateVideo({ videoSrc }: { videoSrc?: string }) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        void video.play().catch(() => {});
      } else video.pause();
    }, { threshold: .35 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoSrc]);

  return <section className={styles.section} aria-labelledby="real-estate-video-title">
    <div className={styles.inner}>
      <h2 id="real-estate-video-title" className={styles.title}>{t('Transpareça a verdadeira qualidade do seu trabalho.')}</h2>
      <p className={styles.description}>{t('Vídeos realistas para imobiliárias. Seu cliente sente o espaço antes de visitar o imóvel.')}</p>
      <div className={styles.posterWrap}>
        <div className={styles.poster}>
          {videoSrc ? <video ref={videoRef} src={videoSrc} poster="/ezway-demo-studio.jpg" muted playsInline loop controls preload="metadata" aria-label={t('Vídeo de apresentação de imóvel')} /> :
            <Image src="/ezway-demo-studio.jpg" alt={t('Imagem ilustrativa de um ambiente interno, não uma prévia de vídeo produzido pela ezway')} fill sizes="(max-width: 767px) 100vw, 1080px" className={styles.image} />}
        </div>
      </div>
      {!videoSrc && <p className={styles.disclaimer}>{t('Imagem ilustrativa. Vídeo demonstrativo em preparação.')}</p>}
    </div>
  </section>;
}
