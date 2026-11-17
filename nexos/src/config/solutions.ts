/** Commercial content only. Never import CRM records into the public catalogue. */
export type Solution = {
  id: string;
  name: string;
  category: 'Organizar' | 'Atender' | 'Apresentar' | 'Conectar';
  stage: 'Presença e acesso' | 'Organização e relacionamento' | 'Automação e evolução';
  need: string;
  audience: string;
  benefits: string[];
  deliveries: string[];
  limits: string;
  example: string;
  connection: string;
  availability: 'catalogue' | 'development' | 'pending';
  source: string;
  asset: { src: string; alt: string } | null;
  href: string;
  cta: string;
  message: string;
};

export const diagnosticMessage = 'Olá! Vim pelo site da EZWAY e gostaria de conversar sobre meu negócio para entender qual solução faz sentido.';

export const needs = [
  { id: 'organizar', name: 'Organizar', description: 'Ter clareza sobre oportunidades, clientes e a rotina financeira.' },
  { id: 'atender', name: 'Atender', description: 'Dar continuidade às conversas e entender o que pode ser automatizado.' },
  { id: 'apresentar', name: 'Apresentar', description: 'Mostrar seus serviços e trabalhos de um jeito fácil de entender.' },
  { id: 'conectar', name: 'Conectar', description: 'Facilitar o caminho entre o interesse do cliente e o próximo passo.' },
] as const;

export const heroSolutionExamples = [
  { id: 'gestao', label: 'Controle e gestão', note: null },
  { id: 'sites', label: 'Sites e portfólios', note: null },
  { id: 'biolink', label: 'Mini-sites/Bio-links', note: null },
  { id: 'easychat', label: 'EasyChat | Chatbot IA', note: 'Em desenvolvimento' },
] as const;

export const solutions: Solution[] = [
  {
    id: 'gestao', name: 'Controle & Gestão', category: 'Organizar', stage: 'Organização e relacionamento',
    need: 'Organizar oportunidades, clientes e a rotina financeira.', audience: 'Negócios e equipes com retornos e vendas a acompanhar.',
    benefits: ['Clientes organizados', 'Retornos no radar', 'Vendas e financeiro à vista'], deliveries: ['Prospecções e contatos', 'Pipeline com Retentativas', 'Histórico e acompanhamentos', 'Clientes e vendas', 'Catálogo de produtos e serviços', 'Visão financeira'], limits: 'Escopo e disponibilidade são alinhados no diagnóstico. Não implica integração bancária, contabilidade ou sincronização com outros produtos.',
    example: 'Acompanhar uma oportunidade até a venda e sua informação financeira.', connection: 'Combinações e integrações precisam de confirmação específica.',
    availability: 'catalogue', source: 'Inspeção autenticada, somente leitura, em localhost:3001 em 15/11/2026: dashboard, prospecções, pipeline, ficha com histórico e agendamento, clientes, vendas e catálogo com Controle & Gestão registrado. Ações de gravação não executadas.', asset: null,
    href: '#gestao', cta: 'Conversar sobre minha gestão', message: 'Olá! Gostaria de conversar sobre a organização comercial e administrativa do meu negócio.',
  },
  {
    id: 'chatbot', name: 'Chatbot de atendimento', category: 'Atender', stage: 'Organização e relacionamento',
    need: 'Reduzir perguntas repetitivas em um fluxo de atendimento definido.', audience: 'Negócios com dúvidas recorrentes.',
    benefits: [], deliveries: [], limits: 'Canais, ações, integrações e disponibilidade dependem de confirmação.',
    example: 'Responder dúvidas frequentes dentro de um escopo validado.', connection: 'Não presume histórico compartilhado com outros sistemas.',
    availability: 'pending', source: 'Briefing do guia mestre; confirmação comercial pendente.', asset: null,
    href: '#ecossistema', cta: 'Conversar sobre atendimento', message: 'Olá! Quero entender as possibilidades de atendimento para meu negócio.',
  },
  {
    id: 'easychat', name: 'EasyChat', category: 'Organizar', stage: 'Automação e evolução',
    need: 'Apoiar a rotina administrativa com IA.', audience: 'Empreendedores e operações administrativas.',
    benefits: ['Conhecer uma proposta de organização administrativa por conversa.'], deliveries: ['Prévia conceitual de um assistente administrativo com IA.'],
    limits: 'Em desenvolvimento. As funcionalidades da prévia são previstas e não representam um serviço disponível.',
    example: 'Prévia ilustrativa de solicitação de documento para revisão.', connection: 'Não implica integração com gestão ou chatbot.',
    availability: 'development', source: 'README.md e seção EasyChat; status de desenvolvimento preservado.', asset: null,
    href: '#easychat', cta: 'Conhecer o projeto EasyChat', message: 'Olá! Quero conhecer o projeto EasyChat, que está em desenvolvimento, e conversar sobre alternativas disponíveis.',
  },
  {
    id: 'site', name: 'Sites vitrine e institucionais', category: 'Apresentar', stage: 'Presença e acesso',
    need: 'Apresentar a empresa, seus serviços e formas de contato.', audience: 'Empresas e profissionais que precisam explicar seu trabalho.',
    benefits: ['Reunir apresentação, serviços e contato em um só lugar.'], deliveries: ['Apresentação da empresa', 'Serviços e formas de contato'],
    limits: 'Páginas e funcionalidades são definidas no escopo. Loja, área restrita e integrações não estão automaticamente incluídas.',
    example: 'Uma empresa de serviços apresenta suas áreas de atuação e convida para uma conversa.', connection: 'Pode ser o destino de um biolink, NFC ou QR Code, conforme o projeto.',
    availability: 'catalogue', source: 'src/config.ts: Desenvolvimento ezway; rota /criacao-de-sites.', asset: { src: '/ezway-demo-studio.jpg', alt: 'Imagem de uma demonstração ilustrativa de site' },
    href: '/criacao-de-sites', cta: 'Conversar sobre meu site', message: 'Olá! Tenho interesse em um site para apresentar minha empresa e seus serviços.',
  },
  {
    id: 'portfolio', name: 'Portfólios', category: 'Apresentar', stage: 'Presença e acesso',
    need: 'Apresentar trabalhos e projetos com clareza.', audience: 'Profissionais e empresas com trabalhos a mostrar.',
    benefits: ['Dar contexto aos trabalhos e facilitar o contato.'], deliveries: ['Apresentação de trabalhos e projetos', 'Caminho para contato'],
    limits: 'Organização, quantidade de projetos e atualizações são alinhadas no escopo.',
    example: 'Um prestador de serviços reúne seus projetos por tipo de trabalho.', connection: 'Pode receber acessos do site, de links ou de uma placa, sem sincronização automática.',
    availability: 'catalogue', source: 'src/config.ts: Desenvolvimento ezway; exemplos em Services.', asset: null,
    href: '/criacao-de-sites', cta: 'Conversar sobre meu portfólio', message: 'Olá! Quero apresentar meus trabalhos em um portfólio digital.',
  },
  {
    id: 'landing', name: 'Landing pages', category: 'Apresentar', stage: 'Presença e acesso',
    need: 'Apresentar uma oferta ou objetivo específico.', audience: 'Negócios com uma ação ou serviço definido.',
    benefits: ['Concentrar a mensagem e deixar o próximo passo claro.'], deliveries: ['Página focada em um objetivo', 'Apresentação e chamada para ação'],
    limits: 'Não inclui automaticamente mídia paga, CRM ou automação e não garante conversão.',
    example: 'Uma página apresenta um serviço e convida o visitante a conversar.', connection: 'Pode ser destino de uma campanha ou de um link; integrações exigem escopo próprio.',
    availability: 'catalogue', source: 'src/config.ts e rota /landing-pages.', asset: { src: '/ezway-demo-cafe.jpg', alt: 'Imagem de uma demonstração ilustrativa de landing page' },
    href: '/landing-pages', cta: 'Conversar sobre minha página', message: 'Olá! Tenho interesse em uma landing page para um objetivo específico do meu negócio.',
  },
  {
    id: 'menu', name: 'Cardápios digitais', category: 'Apresentar', stage: 'Presença e acesso',
    need: 'Permitir consulta organizada de itens e informações.', audience: 'Negócios de alimentação.',
    benefits: ['Facilitar a consulta de categorias e descrições no celular.'], deliveries: ['Apresentação organizada de itens e informações'],
    limits: 'Pedidos, pagamentos, estoque e integrações não estão automaticamente incluídos.',
    example: 'Um estabelecimento apresenta categorias e descrições acessíveis por QR Code.', connection: 'Pode ser o destino de uma placa NFC, QR Code ou link.',
    availability: 'catalogue', source: 'src/config.ts e rota /cardapio-digital.', asset: null,
    href: '/cardapio-digital', cta: 'Conversar sobre meu cardápio', message: 'Olá! Quero organizar a apresentação dos itens do meu negócio em um cardápio digital.',
  },
  {
    id: 'biolink', name: 'Biolinks', category: 'Conectar', stage: 'Presença e acesso',
    need: 'Concentrar os principais destinos digitais.', audience: 'Negócios com vários canais e links.', benefits: [], deliveries: [],
    limits: 'Validar oferta, edição, métricas e disponibilidade.', example: 'Reunir site, portfólio e contato em um endereço.', connection: 'Pode encaminhar para outros destinos; não implica integração.',
    availability: 'pending', source: 'Briefing do guia mestre; oferta comercial a confirmar.', asset: null,
    href: '#ecossistema', cta: 'Conversar sobre meus links', message: 'Olá! Quero conversar sobre como organizar os destinos digitais do meu negócio.',
  },
  {
    id: 'nfc', name: 'Placas NFC com QR Code', category: 'Conectar', stage: 'Presença e acesso',
    need: 'Facilitar o acesso a um destino digital escolhido.', audience: 'Negócios com balcão ou atendimento presencial.',
    benefits: ['Levar o cliente ao destino escolhido por aproximação compatível ou leitura do código.'], deliveries: ['NFC e QR Code na mesma placa', 'Destino alinhado com a equipe'],
    limits: 'NFC depende de compatibilidade e configuração do celular. O destino pode exigir internet. Personalização e entrega são alinhadas com a equipe.',
    example: 'Uma pessoa consulta o cardápio ou abre o contato a partir da placa.', connection: 'Pode levar a um site, cardápio, portfólio ou contato confirmado.',
    availability: 'catalogue', source: 'src/config.ts, public/nfcs e seção PlacaNFCSection.', asset: { src: '/nfcs/nfccardapio.svg', alt: 'Placa de cardápio com NFC e QR Code' },
    href: '/placa-nfc', cta: 'Conversar sobre minha placa', message: 'Olá! Tenho interesse em uma placa NFC com QR Code para facilitar o acesso dos meus clientes.',
  },
  {
    id: 'audiovisual', name: 'Conteúdo audiovisual com IA', category: 'Apresentar', stage: 'Presença e acesso',
    need: 'Apoiar a apresentação visual de uma proposta.', audience: 'Negócios com uma ideia a comunicar.', benefits: [], deliveries: [],
    limits: 'Validar escopo, disponibilidade, direitos de uso e demonstrações antes de ampliar a divulgação.', example: 'Peça de apresentação de um serviço, sujeita à validação.', connection: 'Uso em páginas depende do escopo.',
    availability: 'pending', source: 'Briefing do guia mestre; vídeo existente não comprova oferta.', asset: null,
    href: '#ecossistema', cta: 'Conversar sobre conteúdo', message: 'Olá! Quero conversar sobre a apresentação visual do meu negócio.',
  },
  {
    id: 'suporte', name: 'Suporte e acompanhamento', category: 'Atender', stage: 'Organização e relacionamento',
    need: 'Entender os próximos passos de cada entrega.', audience: 'Clientes das soluções, conforme escopo.',
    benefits: ['Alinhar dúvidas e próximos passos com a equipe.'], deliveries: ['Conversa para definição do projeto'],
    limits: 'Canais, horários, duração e condições de acompanhamento são confirmados para cada projeto.',
    example: 'Cliente e equipe alinham os pontos de revisão de uma entrega.', connection: 'Participação da equipe conforme a solução e o escopo definidos.',
    availability: 'catalogue', source: 'Seções DeliveryProcess e MascotSolutions; condições específicas não confirmadas.', asset: null,
    href: '#delivery-process', cta: 'Conversar sobre os próximos passos', message: diagnosticMessage,
  },
];

/** Pending records stay internal until their functionality and commercial scope are validated. */
export const publicSolutions = solutions.filter(solution => solution.availability !== 'pending');
