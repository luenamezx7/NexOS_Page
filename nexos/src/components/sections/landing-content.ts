// Editable demonstration data. Replace with verified values before using as results.
export const DEMO_METRICS = {
  month: { label: '30 dias', values: [18, 24, 21, 35, 32, 47, 43, 58, 54, 70, 67, 82], total: '631', change: '+24%' },
  quarter: { label: '90 dias', values: [25, 20, 31, 29, 46, 40, 58, 51, 72, 68, 85, 94], total: '1.842', change: '+38%' },
};

export const DELIVERY_STEPS = {
  product: [
    { title: 'Conversa', body: 'Entendemos seu negócio, onde a placa será usada e o que seu cliente precisa encontrar.', detail: 'Uso + quantidade' },
    { title: 'Personalização', body: 'Alinhamos a identidade da placa e o endereço de destino, que pode ser seu ou desenvolvido à parte pela ezway.', detail: 'Sua marca + seu endereço' },
    { title: 'Preparação', body: 'Conferimos a arte e o acesso ao endereço configurado antes de finalizar a placa.', detail: 'Arte + acesso' },
    { title: 'Entrega', body: 'Combinamos o envio e orientamos a utilização no seu ponto de atendimento.', detail: 'Produto + orientação' },
  ],
  service: [
    { title: 'Conversa', body: 'Entendemos o objetivo, as referências e o que o projeto precisa resolver.', detail: 'Objetivo + escopo' },
    { title: 'Design', body: 'Organizamos as informações e desenhamos a experiência com a sua identidade.', detail: 'Estrutura + visual' },
    { title: 'Construção', body: 'Transformamos o design em uma experiência funcional, com espaço para revisão.', detail: 'Código + validação' },
    { title: 'Publicação', body: 'Conferimos os detalhes, publicamos e alinhamos os próximos passos com você.', detail: 'Entrega + continuidade' },
  ],
};
