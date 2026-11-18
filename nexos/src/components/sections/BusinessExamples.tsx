'use client';

import { useLocale } from '@/lib/locale';
import styles from './Ecosystem.module.css';

const examples = [
  ['Prestadores de serviços', 'Apresentar trabalhos e acompanhar interessados.', 'Portfólio ou site para mostrar serviços; gestão para organizar oportunidades e retornos.'],
  ['Pequenos comércios', 'Facilitar o contato e organizar o relacionamento.', 'Uma placa direciona para o contato; a gestão ajuda a acompanhar os próximos retornos.'],
  ['Negócios de alimentação', 'Facilitar a consulta dos itens.', 'Cardápio digital acessível por NFC compatível ou QR Code, sem pressupor pedidos ou pagamentos.'],
  ['Escritórios e operações administrativas', 'Organizar clientes, vendas e rotina financeira.', 'Controle & Gestão para acompanhar a operação. EasyChat é uma possibilidade de evolução ainda em desenvolvimento.'],
  ['Empresas em expansão', 'Apresentar serviços e organizar oportunidades.', 'Site ou landing page para explicar a proposta; gestão para acompanhar o relacionamento comercial.'],
];

export function BusinessExamples() {
  const { t } = useLocale();
  return <section id="exemplos" aria-labelledby="examples-title" className={styles.section}><div className={styles.container}>
    <p className={styles.eyebrow}>{t('SOLUÇÕES PARA O SEU NEGÓCIO')}</p><h2 data-heading-static id="examples-title">{t('Como isso entra na sua rotina?')}</h2>
    <p className={styles.lead}>{t('Encontre as soluções que combinam com seu segmento e sua rotina.')}</p>
    <div className={styles.catalogue} style={{ marginTop: 32 }}>{examples.map(([segment, need, combination]) => <article key={segment} className={styles.card}><h3 data-heading-static>{t(segment)}</h3><p><strong>{t(need)}</strong></p><p>{t(combination)}</p></article>)}</div>
    <p className={styles.note}>{t('São combinações possíveis, com escopos próprios. Elas não pressupõem integração automática nem contratação conjunta.')}</p>
  </div></section>;
}
