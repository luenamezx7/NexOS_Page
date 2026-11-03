import { MessageCircle } from 'lucide-react';
import { commercialHref } from '@/lib/commercial';
import styles from './Refactor.module.css';

export function FloatingWhatsApp() {
  return <a href={commercialHref()} target="_blank" rel="noopener noreferrer" className={styles.floating} aria-label="Conversar com a NexOS no WhatsApp"><MessageCircle size={22} strokeWidth={1.75} aria-hidden="true" /></a>;
}
