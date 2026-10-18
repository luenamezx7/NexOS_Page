import Image from 'next/image';
import { ImagePlus } from 'lucide-react';
import styles from './MascotSolutions.module.css';

// Add each mascot photo's public path to `image` when the assets are ready.
const SOLUTIONS: { id: string; title: string; description: string; image: string | null; alt: string }[] = [
  { id: '01', title: 'Atendimento mais direto', description: 'Seu WhatsApp e suas informações a uma aproximação do cliente.', image: null, alt: 'Mascote NexOS demonstrando o acesso ao atendimento pela placa NFC.' },
  { id: '02', title: 'Sua marca bem apresentada', description: 'Sites e portfólios que mostram o valor do que você faz.', image: null, alt: 'Mascote NexOS apresentando um site para um negócio.' },
  { id: '03', title: 'Informação no lugar certo', description: 'Cardápios e páginas digitais para facilitar as escolhas do dia a dia.', image: null, alt: 'Mascote NexOS mostrando um cardápio digital no celular.' },
  { id: '04', title: 'Uma equipe por perto', description: 'Conversa para entender sua necessidade e orientar a próxima solução.', image: null, alt: 'Mascote NexOS oferecendo suporte e orientação ao cliente.' },
];

export function MascotSolutions() {
  return (
    <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>NexOS no seu dia a dia</p>
          <h2 id="mascot-solutions-title">Pequenas conexões.<br />Soluções de verdade.</h2>
          <p>Do primeiro contato à presença digital, veja onde podemos ajudar seu negócio.</p>
        </header>
        <ul className={styles.strip} aria-label="Suportes e soluções NexOS" tabIndex={0}>
          {SOLUTIONS.map(solution => (
            <li key={solution.id} className={styles.item}>
              <figure>
                <div className={styles.photo}>
                  {solution.image ? <Image src={solution.image} alt={solution.alt} fill sizes="(max-width: 767px) 75vw, 280px" /> : <div className={styles.placeholder} role="img" aria-label={`Espaço reservado para foto: ${solution.alt}`}><ImagePlus size={26} strokeWidth={1} aria-hidden="true" /><span>Foto do mascote</span></div>}
                  <span className={styles.index} aria-hidden="true">{solution.id}</span>
                </div>
                <figcaption><h3>{solution.title}</h3><p>{solution.description}</p></figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
