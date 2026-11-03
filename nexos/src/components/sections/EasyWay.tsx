'use client';

import { easyway } from '@/config/easyway';
import { BlurReveal } from '../blur-reveal';
import { ScrollReveal } from '../ScrollReveal';
import { Iphone } from '../ui/iphone';
import { Bell, FileText, Files, ReceiptText, Wallet } from 'lucide-react';
import styles from './EasyWay.module.css';

export function EasyWay() {
  const capabilities = [
    { icon: FileText, label: 'Gera documentos em um único pedido' },
    { icon: ReceiptText, label: 'Lê e organiza notas fiscais' },
    { icon: Files, label: 'Converte OFX, PDF, Word e mais' },
    { icon: Bell, label: 'Lembretes com aviso na data' },
    { icon: Wallet, label: 'Apoio básico em finanças' },
  ];
  return <section id="easyway" aria-labelledby="easyway-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.top}><span>Assistente administrativo com IA</span><span className={styles.status}><i aria-hidden="true" />{easyway.status}</span></div>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.name}>{easyway.name}</p>
          <BlurReveal as="h2" id="easyway-title" className={styles.heading} inView speedReveal={3} speedSegment={.8}>{easyway.headline}</BlurReveal>
          <ScrollReveal as="p" className={styles.description}>{easyway.description}</ScrollReveal>
          <p className={styles.capabilityTitle}>Funcionalidades previstas</p>
          <ul className={styles.capabilities}>{capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} aria-hidden="true" />{label}</li>)}</ul>
          <p className={styles.disclaimer}>Nome provisório. Interface conceitual.</p>
        </div>
        <ScrollReveal as="figure" preset="image" className={styles.mockup}>
          <div className={styles.phonePreview} role="img" aria-label="Prévia conceitual da EasyWay: pedido de documento e funcionalidades previstas">
            <Iphone className={styles.device} aria-hidden="true" />
            <div className={styles.phoneScreen} aria-hidden="true"><span className={styles.phoneBrand}>EasyWay · prévia</span><div className={styles.phoneBubble}>Preciso organizar meus documentos.</div><span className={styles.phoneReply}>Como posso ajudar?</span><div className={styles.phoneChips}><span>Documentos</span><span>Notas fiscais</span><span>Lembretes</span></div><span className={styles.phoneInput}>Descreva seu pedido…</span></div>
          </div>
          <figcaption>Prévia do projeto</figcaption>
        </ScrollReveal>
      </div>
    </div>
  </section>;
}
