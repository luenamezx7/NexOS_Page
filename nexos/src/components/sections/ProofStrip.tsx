import styles from './Refactor.module.css';
import { landingEvidence } from '@/config/landing-evidence';

export function ProofStrip() {
  return <section id="proof" className={styles.proof} aria-label="Clientes fundadores">
    <div className={styles.inner}>
      {landingEvidence.proof.length > 0 ? <><p>Projetos e resultados</p><ul>{landingEvidence.proof.map(item => <li key={item.label}><strong>{item.label}</strong><span>{item.detail}</span></li>)}</ul></> :
        <div className={styles.founderInvite}><div><strong>Clientes fundadores</strong><p>Seu negócio pode fazer parte dos próximos projetos da NexOS.</p></div><a href="#contact">Agendar conversa</a></div>}
    </div>
  </section>;
}
