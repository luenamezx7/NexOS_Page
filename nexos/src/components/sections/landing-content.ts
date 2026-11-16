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
    { title: 'Diagnóstico', body: 'Conversamos sobre sua rotina, o que precisa organizar e o próximo objetivo do negócio.', detail: 'Rotina + necessidade' },
    { title: 'Definição da solução', body: 'Alinhamos a solução, o escopo e a disponibilidade para a sua necessidade.', detail: 'Solução + escopo' },
    { title: 'Implementação', body: 'Preparamos a entrega definida com você e alinhamos os pontos de revisão do projeto.', detail: 'Construção + revisão' },
    { title: 'Acompanhamento', body: 'Conversamos sobre a utilização e os próximos passos conforme as condições definidas para a entrega.', detail: 'Orientação + continuidade' },
  ],
};
