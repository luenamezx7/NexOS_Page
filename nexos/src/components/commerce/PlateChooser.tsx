'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { ArrowUpRight, X } from 'lucide-react';
import { gsap } from 'gsap';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { PLATE_USES, type PlateUse } from '@/lib/plate-uses';
import { plateCommercialHref } from '@/lib/commercial';
import { useScrollLock } from '../useScrollLock';
import { useLocale } from '@/lib/locale';
import styles from './PlateChooser.module.css';
import { usePresentationActive } from '@/lib/use-presentation-active';

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};

const PLATE_IMAGES = {
  menu: '/nfcs/nfccardapio.svg',
  instagram: '/nfcs/nfcinsta.svg',
  whatsapp: '/nfcs/nfcwpp.svg',
  google: '/nfcs/nfcgoogle.svg',
} as const;

function PlateFace({ plate, qr, large = false }: { plate: PlateUse; qr?: string; large?: boolean }) {
  return <div className={styles.plate} data-plate-face={plate.id} data-large={large} aria-hidden="true">
    <Image src={PLATE_IMAGES[plate.id]} alt="" width={1000} height={1000} unoptimized className={styles.plateImage} sizes={large ? '(max-width: 600px) 290px, 350px' : '(max-width: 850px) 45vw, 24vw'} />
    {/* Each SVG includes a decorative QR; place its working destination over it. */}
    <div className={styles.qrArea} data-demo-qr>{qr ? <Image src={qr} alt="" width={320} height={320} unoptimized /> : null}</div>
  </div>;
}

function TiltingPlate({ plate, qr }: { plate: PlateUse; qr?: string }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const size = useMotionValue(1);
  const rotateX = useSpring(x, { stiffness: 220, damping: 26 });
  const rotateY = useSpring(y, { stiffness: 220, damping: 26 });
  const scale = useSpring(size, { stiffness: 220, damping: 26 });
  const reset = () => { x.set(0); y.set(0); size.set(1); };
  return <div className={styles.detailPlate} onPointerMove={event => {
    if (reduced || event.pointerType === 'touch' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((.5 - (event.clientY - bounds.top) / bounds.height) * 32);
    y.set(((event.clientX - bounds.left) / bounds.width - .5) * 32);
    size.set(1.035);
  }} onPointerLeave={reset} onPointerCancel={reset}>
    <motion.div className={styles.tiltPlate} style={reduced ? undefined : { rotateX, rotateY, scale }}><PlateFace plate={plate} qr={qr} large /></motion.div>
  </div>;
}

export function PlateChooser({ onSelect }: { onSelect?: (name: string) => void }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<PlateUse | null>(null);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const visible = useInView(gridRef, { amount: .01 });
  const foreground = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => false);
  const presenting = usePresentationActive();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  useScrollLock(selected !== null);

  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then(async qr => {
      const entries = await Promise.all(PLATE_USES.map(async plate => [plate.id, await qr.toDataURL(plate.demoUrl, { width: 320, margin: 4, color: { dark: '#111019', light: '#ffffff' } })] as const));
      if (!cancelled) setQrs(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const content = dialog.querySelector<HTMLElement>('[data-plate-dialog-content]');
    if (selected) {
      dialog.showModal();
       dialog.querySelector<HTMLButtonElement>('button[data-close-plate]')?.focus({ preventScroll: true });
      if (content && !motionMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(content, { autoAlpha: 0, y: 20, scale: .98 }, { autoAlpha: 1, y: 0, scale: 1, duration: .55, ease: 'power3.out', clearProps: 'all' });
      }
    } else if (dialog.open) dialog.close();
    return () => { if (content) gsap.killTweensOf(content); };
  }, [selected]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const dialog = dialogRef.current;
    const content = dialog?.querySelector<HTMLElement>('[data-plate-dialog-content]');
    const finish = () => {
      dialog?.close();
      setSelected(null);
      triggerRef.current?.focus({ preventScroll: true });
      closingRef.current = false;
    };
    if (!content || motionMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    gsap.killTweensOf(content);
    gsap.to(content, { autoAlpha: 0, y: 10, scale: .985, duration: .2, ease: 'power2.in', onComplete: finish });
  };

  return <>
    <div ref={gridRef} className={styles.grid} data-plate-grid data-motion-active={visible && foreground && !presenting && !selected} aria-label={t('Escolha sua placa pelo uso')}>
      {PLATE_USES.map(plate => <article key={plate.id} className={styles.option} data-plate-option={plate.id}>
        <button type="button" className={styles.plateButton} aria-haspopup="dialog" aria-label={`${t('Ver placa')} ${t(plate.name)}`} onClick={event => { triggerRef.current = event.currentTarget; onSelect?.(plate.name); setSelected(plate); }}>
          <span className={styles.shelf}><span className={styles.plateMotion} data-plate-motion><PlateFace plate={plate} qr={qrs[plate.id]} /></span></span>
          <span className={styles.caption} data-plate-caption><span className={styles.optionTitle}>{t(plate.name)}</span><span className={styles.optionDescription}>{t(plate.caption)}</span><span className={styles.detailsAction}>{t('Ver detalhes')} <ArrowUpRight size={16} aria-hidden="true" /></span></span>
        </button>
      </article>)}
    </div>
    <p className={styles.disclaimer}>{t('Nesta vitrine, os QR codes levam aos canais da ezway. Na sua placa, o destino e a personalização são definidos com você.')}</p>
     <dialog ref={dialogRef} className={styles.dialog} tabIndex={-1} autoFocus aria-labelledby="plate-dialog-title" aria-describedby="plate-dialog-description" data-lenis-prevent onCancel={event => { event.preventDefault(); close(); }} onClose={() => { if (selected) { setSelected(null); triggerRef.current?.focus({ preventScroll: true }); } }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {selected && <div className={styles.dialogContent} data-plate-dialog-content>
        <button type="button" data-close-plate className={styles.close} aria-label={t('Fechar detalhes da placa')} onClick={close}><X size={22} /></button>
         <TiltingPlate plate={selected} qr={qrs[selected.id]} />
        <div className={styles.detailCopy}>
          <span className={styles.detailLabel}>{t('PLACA INTELIGENTE · NFC + QR')}</span>
          <h2 id="plate-dialog-title">{t(selected.name)}</h2>
          <p className={styles.detailCaption}>{t(selected.caption)}</p>
          <p id="plate-dialog-description">{t(selected.description)}</p>
          <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.demoLink}>{t('Conhecer este destino')} <ArrowUpRight size={16} aria-hidden="true" /></a>
          <a className="btn-primary-nex" href={plateCommercialHref(selected.name, t)} target="_blank" rel="noopener noreferrer">{t('Entender mais')} <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
      </div>}
    </dialog>
  </>;
}
