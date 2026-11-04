'use client';

import { easychat } from '@/config/easychat';
import { BlurReveal } from '../blur-reveal';
import { ScrollReveal } from '../ScrollReveal';
import { Iphone } from '../ui/iphone';
import { Bell, FileText, Files, ReceiptText, Wallet } from 'lucide-react';
import styles from './EasyChat.module.css';
import { useLocale } from '@/lib/locale';

export function EasyChat() {
  const { t } = useLocale();
  const capabilities = [
    { icon: FileText, label: 'Gera documentos em um único pedido' },
    { icon: ReceiptText, label: 'Lê e organiza notas fiscais' },
    { icon: Files, label: 'Converte OFX, PDF, Word e mais' },
    { icon: Bell, label: 'Lembretes com aviso na data' },
    { icon: Wallet, label: 'Apoio básico em finanças' },
  ];
  return <section id="easychat" aria-labelledby="easychat-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.top}><span>{t('Assistente administrativo com IA')}</span><span className={styles.status}><i aria-hidden="true" />{t(easychat.status)}</span></div>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.name}>{easychat.name}</p>
          <BlurReveal as="h2" id="easychat-title" className={styles.heading} inView speedReveal={3} speedSegment={.8}>{t(easychat.headline)}</BlurReveal>
          <ScrollReveal as="p" className={styles.description}>{t(easychat.description)}</ScrollReveal>
          <p className={styles.capabilityTitle}>{t('Funcionalidades previstas')}</p>
          <ul className={styles.capabilities}>{capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} aria-hidden="true" />{t(label)}</li>)}</ul>
          <p className={styles.disclaimer}>{t('Nome provisório. Interface conceitual.')}</p>
        </div>
        <ScrollReveal as="figure" preset="image" className={styles.mockup}>
           <div className={styles.phonePreview} role="img" aria-label={t('Prévia conceitual do EasyChat: pedido de documento e funcionalidades previstas')}>
            <Iphone className={styles.device} aria-hidden="true">
              <div className={styles.phoneScreen}><span className={styles.phoneBrand}>{t('EasyChat · prévia')}</span><div className={styles.phoneBubble}>{t('Preciso organizar meus documentos.')}</div><span className={styles.phoneReply}>{t('Como posso ajudar?')}</span><div className={styles.phoneChips}><span>{t('Documentos')}</span><span>{t('Notas fiscais')}</span><span>{t('Lembretes')}</span></div><span className={styles.phoneInput}>{t('Descreva seu pedido…')}</span></div>
            </Iphone>
          </div>
           <figcaption>{t('Prévia do projeto')}</figcaption>
        </ScrollReveal>
      </div>
    </div>
  </section>;
}
