'use client';

import { useRef, type RefObject } from 'react';
import { Cpu } from 'lucide-react';
import { raithonRealm } from '@/lib/brand-font';
import { AnimatedBeam } from './ui/animated-beam';
import styles from './NexosIntegrations.module.css';

type AppId = 'whatsapp' | 'instagram' | 'notion' | 'docs' | 'ai';

/** App marks use monochrome Simple Icons silhouettes, alongside the existing Lucide set. */
function IntegrationIcon({ app }: { app: AppId }) {
  if (app === 'instagram') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (app === 'ai') return <Cpu strokeWidth={1.6} aria-hidden="true" />;
  const paths = {
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
    notion: 'M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z',
    docs: 'M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zm-.545 10.455H7.09v-1.364h7.09v1.364zm2.727-3.273H7.091v-1.364h9.818v1.364zm0-3.273H7.091V9.273h9.818v1.363zM14.727 6h6l-6-6v6z',
  };
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={paths[app]} /></svg>;
}

function IntegrationNode({ app, name, nodeRef }: { app: AppId; name: string; nodeRef: RefObject<HTMLDivElement | null> }) {
  return <li className={styles.app} data-app={app}>
    <div ref={nodeRef} className={styles.appIcon} data-integration-node><IntegrationIcon app={app} /></div>
    <span>{name}</span>
  </li>;
}

export function NexosIntegrations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);
  const notionRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  return <figure className={`${styles.figure} ${raithonRealm.variable}`} aria-label="NexOS conectada a WhatsApp, Instagram, Notion, Google Docs e inteligência artificial">
    <div ref={containerRef} className={styles.diagram} data-integrations>
      <AnimatedBeam containerRef={containerRef} fromRef={whatsappRef} toRef={centerRef} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={instagramRef} toRef={centerRef} delay={.7} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={notionRef} toRef={centerRef} delay={1.4} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={docsRef} toRef={centerRef} delay={2.1} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={aiRef} toRef={centerRef} delay={2.8} duration={4.8} repeatDelay={1.5} />
      <div ref={centerRef} className={styles.center} data-integration-center><span role="img" aria-label="Logo NexOS" className={styles.wordmark}>nexos</span></div>
      <ul className={styles.apps} aria-label="Aplicativos conectados">
        <IntegrationNode app="whatsapp" name="WhatsApp" nodeRef={whatsappRef} />
        <IntegrationNode app="instagram" name="Instagram" nodeRef={instagramRef} />
        <IntegrationNode app="notion" name="Notion" nodeRef={notionRef} />
        <IntegrationNode app="docs" name="Google Docs" nodeRef={docsRef} />
        <IntegrationNode app="ai" name="IA" nodeRef={aiRef} />
      </ul>
    </div>
    <figcaption>Seus apps, conectados.</figcaption>
  </figure>;
}
