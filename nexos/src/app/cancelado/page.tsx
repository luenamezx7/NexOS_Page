'use client';

import Link from 'next/link';
import styles from './Cancel.module.css';
import { config } from '@/config';
import { Button } from '@/components/ui/Button';
import { XCircle, ArrowLeft, MessageSquare, RotateCcw } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className={styles.container}>
      <div className={styles.cancel}>
        <div className={styles.iconWrapper}>
          <XCircle size={64} strokeWidth={3} className={styles.icon} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Pagamento cancelado</h1>
        <p className={styles.subtitle}>
          Nenhuma cobrança foi realizada. Seu carrinho continua salvo caso queira tentar novamente.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={() => window.location.href = '/#services'}>
            <RotateCcw size={20} strokeWidth={2.5} aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button variant="secondary" size="lg" onClick={() => window.location.href = '/'}>
            <ArrowLeft size={20} strokeWidth={2.5} aria-hidden="true" />
            Voltar ao início
          </Button>
        </div>
        <div className={styles.help}>
          <p>Precisa de ajuda?</p>
          <a
            href={`https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent('Oi, tive um problema no pagamento e gostaria de ajuda.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappLink}
          >
            <MessageSquare size={18} strokeWidth={2.5} aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}