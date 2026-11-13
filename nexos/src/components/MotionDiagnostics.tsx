'use client';

import { useEffect, useRef, useState } from 'react';
import { readMotionObservations, recordMotion } from '@/lib/motion-diagnostics';
import styles from './MotionDiagnostics.module.css';

let previousVideoTime: number | null = null;
function snapshot() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video] video');
  const advancedSincePreviousSample = video && previousVideoTime !== null ? video.currentTime !== previousVideoTime : null;
  previousVideoTime = video?.currentTime ?? null;
  const observed = readMotionObservations();
  return {
    schemaVersion: 2,
    motionPolicy: { effectiveMotion: 'full', reason: 'complete-experience-on-all-devices', automaticQualityReduction: false },
    build: process.env.NEXT_PUBLIC_MOTION_BUILD || 'local',
    capturedAt: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      cores: navigator.hardwareConcurrency || null,
      memoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      finePointer: matchMedia('(pointer: fine)').matches,
      visibility: document.visibilityState,
    },
    ...observed,
    presentation: {
      open: !!document.querySelector('dialog[data-presentation][open]'),
      phase: document.querySelector('[data-presentation]')?.getAttribute('data-phase') ?? 'absent',
    },
    reveals: Object.fromEntries(['pending', 'entering', 'visible'].map(state => [state, document.querySelectorAll(`[data-reveal-state="${state}"]`).length])),
    motionDetail: document.querySelector<HTMLElement>('.landing-page')?.dataset.motionDetail ?? 'not-set',
    video: video ? {
      sourceAssigned: !!video.getAttribute('src'),
      paused: video.paused, currentTime: video.currentTime,
      advancedSincePreviousSample,
      readyState: video.readyState, networkState: video.networkState,
      errorCode: video.error?.code ?? null,
      // A time sample is evidence of playback, not a claim about GPU health.
      muted: video.muted,
    } : null,
    scrollDom: { lenis: document.documentElement.classList.contains('lenis'), stopped: document.documentElement.classList.contains('lenis-stopped') },
    interpretation: 'Estados observados neste navegador. Hardware informado não comprova falha de GPU. Recursos ausentes ainda não foram observados. O avanço do vídeo é amostrado, não mede fluidez.',
  };
}

export default function MotionDiagnostics() {
  const [report, setReport] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const selecting = useRef(false);
  useEffect(() => {
    const update = () => setReport(JSON.stringify(snapshot(), null, 2));
    const onError = () => recordMotion('runtime', 'error-observed', 'window.error; detalhes omitidos');
    const onRejection = () => recordMotion('runtime', 'rejection-observed', 'unhandledrejection; detalhes omitidos');
    update();
    const timer = window.setInterval(() => { if (!document.hidden && !selecting.current) update(); }, 1000);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      clearInterval(timer);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return <aside className={styles.panel} aria-label="Diagnóstico de movimento" data-motion-diagnostics data-lenis-prevent>
    <details>
      <summary>Diagnóstico de movimento</summary>
      <p>Role a página e copie o relatório. Os dados ficam neste navegador. A apresentação precisa terminar antes de usar este painel.</p>
      <p>Experiência completa ativa. Preferência informada pelo navegador: {report.includes('"reducedMotion": true') ? 'reduzir movimento' : 'movimento normal'}.</p>
      <textarea ref={textRef} aria-label="Relatório de movimento" value={report} readOnly spellCheck={false}
        onFocus={() => { selecting.current = true; }} onBlur={() => { selecting.current = false; }} />
      <button type="button" onClick={async () => {
        const fresh = JSON.stringify(snapshot(), null, 2);
        setReport(fresh);
        try {
          await navigator.clipboard.writeText(fresh);
          setCopyStatus('Relatório copiado.');
        } catch {
          selecting.current = true;
          requestAnimationFrame(() => { textRef.current?.focus(); textRef.current?.select(); });
          setCopyStatus('Selecione o relatório e copie com Ctrl+C ou Cmd+C.');
        }
      }}>Copiar relatório</button>
      <p role="status">{copyStatus}</p>
    </details>
  </aside>;
}
