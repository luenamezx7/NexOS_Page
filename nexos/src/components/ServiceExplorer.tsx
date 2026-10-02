'use client';

import { ArrowUpRight, CreditCard, LayoutGrid, ShoppingBag, SquareUserRound } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from './ui/field';
import { Slipstream } from './ui/background-ascii-flow';
import styles from './commerce/Commerce.module.css';

export type ServiceGoal = 'all' | 'sell' | 'present' | 'payments';
const GOALS = [
  { id: 'all', label: 'Explorar tudo', icon: LayoutGrid },
  { id: 'sell', label: 'Quero vender', icon: ShoppingBag },
  { id: 'present', label: 'Apresentar marca', icon: SquareUserRound },
  { id: 'payments', label: 'Validar pagamentos', icon: CreditCard },
] as const;
const GUIDES: Record<ServiceGoal, { title: string; description: string; tags: string[] }> = {
  all: { title: 'Qual é seu próximo passo?', description: 'Escolha um objetivo e encontre o caminho mais direto para o seu negócio.', tags: ['Design', 'Desenvolvimento', 'Integração'] },
  sell: { title: 'Transforme interesse em ação.', description: 'Landing pages e cardápios digitais organizam sua oferta e dão ao cliente um caminho claro para comprar.', tags: ['Landing page', 'Cardápio digital', 'Contato direto'] },
  present: { title: 'Sua marca, bem apresentada.', description: 'Um portfólio ou uma apresentação digital reúne seu trabalho em uma experiência com a sua identidade.', tags: ['Portfólio', 'Apresentação', 'Identidade visual'] },
  payments: { title: 'Conheça o fluxo de pagamento.', description: 'Explore o checkout integrado. A opção de validação abaixo custa R$ 5,00 caso você conclua o pagamento.', tags: ['Cartão', 'Boleto', 'Checkout Asaas'] },
};

export function ServiceExplorer({ value, onChange }: { value: ServiceGoal; onChange: (value: ServiceGoal) => void }) {
  const guide = GUIDES[value];
  return (
    <div className={styles.explorer}>
      <FieldSet>
        <FieldLegend className="sr-only">Filtrar serviços pelo seu objetivo</FieldLegend>
        <FieldGroup className={styles.goalFilters}>
          {GOALS.map(({ id, label, icon: Icon }) => (
            <label key={id} className={styles.goalFilter} data-selected={value === id}>
              <input type="radio" name="service-goal" value={id} checked={value === id} onChange={() => onChange(id)} />
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />{label}
            </label>
          ))}
        </FieldGroup>
      </FieldSet>
      <div className={styles.goalGuide}>
        <div className={styles.explorerFlow} aria-hidden="true"><Slipstream cellSize={16} /></div>
        <div className={styles.goalGuideCopy} aria-live="polite" aria-atomic="true">
          <h3>{guide.title}</h3><p>{guide.description}</p>
          <div className={styles.guideTags}>{guide.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </div>
        <ArrowUpRight size={32} strokeWidth={1} className={styles.guideArrow} aria-hidden="true" />
      </div>
    </div>
  );
}
