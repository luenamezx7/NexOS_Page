export interface ServicePageContent {
  path: string;
  title: string;
  description: string;
  headline: string;
  intro: string;
  label: string;
  productId: 'dev' | 'placa';
  overviewTitle: string;
  overview: string;
  applications: { title: string; body: string }[];
  preparation: string[];
  steps: { title: string; body: string }[];
  questions: { question: string; answer: string }[];
}

export const servicePages = {
  sites: {
    path: '/criacao-de-sites',
    title: 'Criação de Sites para Empresas',
    description: 'Criação de sites e portfólios para empresas e profissionais. Design e desenvolvimento sob medida, com atendimento remoto da NexOS.',
    headline: 'Um site à altura do seu negócio.',
    intro: 'Apresente seus serviços, organize seus contatos e dê à sua marca um endereço próprio na internet.',
    label: 'Criação de sites',
    productId: 'dev',
    overviewTitle: 'Sua empresa, com espaço próprio.',
    overview: 'Um site institucional reúne o que o cliente precisa para conhecer sua empresa: serviços, informações de contato e formas de começar uma conversa. Na NexOS, o projeto parte do seu objetivo e da identidade do negócio. A estrutura, o design e o desenvolvimento são definidos juntos, com navegação adaptada a celulares e computadores.',
    applications: [
      { title: 'Site institucional', body: 'Organize a apresentação da empresa, seus serviços e canais de atendimento em um só lugar.' },
      { title: 'Portfólio profissional', body: 'Apresente seus trabalhos reais com contexto, imagens e uma forma direta de entrar em contato.' },
      { title: 'Página de apresentação', body: 'Reúna informações essenciais para quem conheceu sua marca em uma indicação, rede social ou visita presencial.' },
    ],
    preparation: ['Nome, identidade visual e informações da empresa.', 'Serviços prioritários e público que você quer atender.', 'Textos, fotos e exemplos de trabalhos que podem ser publicados.', 'Domínio existente e canais de contato, se houver.'],
    steps: [
      { title: 'Definir o objetivo', body: 'Conversamos sobre seu negócio, o público e as informações que o site precisa apresentar.' },
      { title: 'Alinhar o projeto', body: 'Combinamos páginas, materiais, escopo e prazo antes de começar a construção.' },
      { title: 'Revisar e publicar', body: 'Você revisa o conteúdo e a apresentação. A publicação é alinhada com o domínio e a hospedagem escolhidos.' },
    ],
    questions: [
      { question: 'O site funciona no celular?', answer: 'A navegação é desenvolvida para telas de diferentes tamanhos. O conteúdo e os elementos de contato são organizados para uso em celulares e computadores.' },
      { question: 'Preciso ter domínio e hospedagem?', answer: 'O site publicado precisa de um endereço e hospedagem. Se você já possui esses serviços, informe no contato. A configuração e os custos aplicáveis são alinhados na proposta.' },
      { question: 'Qual é o prazo de criação?', answer: 'O prazo depende da quantidade de páginas, funcionalidades e materiais disponíveis. Ele é definido junto com o escopo antes do início do projeto.' },
      { question: 'Meu site vai aparecer em primeiro no Google?', answer: 'Não há garantia de primeira posição. Uma estrutura acessível aos buscadores ajuda, mas o posicionamento também depende do conteúdo, da concorrência e da relevância da página para cada busca.' },
    ],
  },
  landing: {
    path: '/landing-pages',
    title: 'Desenvolvimento de Landing Pages',
    description: 'Landing pages para apresentar ofertas, divulgar serviços e receber contatos. Alinhe sua campanha com design e desenvolvimento sob medida da NexOS.',
    headline: 'Uma página. Uma oferta clara.',
    intro: 'Landing pages para apresentar sua oferta e levar o visitante ao próximo passo: contato, orçamento ou compra.',
    label: 'Landing pages',
    productId: 'dev',
    overviewTitle: 'Do anúncio ao próximo passo.',
    overview: 'Uma landing page concentra a comunicação em uma oferta e em uma ação principal. Em vez de distribuir a atenção entre muitos assuntos, ela explica para quem a solução serve, o que está incluído e como avançar. É uma opção para campanhas, lançamentos ou divulgação de um serviço específico.',
    applications: [
      { title: 'Campanhas de serviços', body: 'Receba visitantes de anúncios ou redes sociais em uma página que explica exatamente a oferta divulgada.' },
      { title: 'Pedidos de orçamento', body: 'Mostre o serviço e direcione interessados para um formulário ou conversa no WhatsApp.' },
      { title: 'Apresentação de produto', body: 'Organize imagens, características, condições e a ação de compra em um percurso claro.' },
    ],
    preparation: ['Oferta principal e público da campanha.', 'Benefícios, condições e dúvidas frequentes do produto ou serviço.', 'Imagens e provas reais que você tem autorização para usar.', 'Ação desejada: WhatsApp, formulário, orçamento ou compra.'],
    steps: [
      { title: 'Escolher a ação', body: 'Definimos o que o visitante deve fazer e de onde virá o tráfego da página.' },
      { title: 'Organizar a oferta', body: 'Alinhamos conteúdo, identidade visual e integrações necessárias para a campanha.' },
      { title: 'Revisar o percurso', body: 'Conferimos a apresentação e os caminhos de contato ou compra antes da publicação.' },
    ],
    questions: [
      { question: 'Qual é a diferença entre landing page e site?', answer: 'Um site pode apresentar vários serviços e informações institucionais. Uma landing page se concentra em uma oferta e uma ação principal, como pedir um orçamento.' },
      { question: 'A landing page já inclui anúncios?', answer: 'A criação da página e a compra de mídia são atividades diferentes. Verba, canais e eventual gestão de anúncios precisam ser combinados separadamente.' },
      { question: 'Posso receber contatos pelo WhatsApp?', answer: 'Sim. O projeto pode direcionar o visitante para o WhatsApp do seu negócio. Formulários e outras integrações são definidos no escopo.' },
      { question: 'Vocês garantem uma taxa de conversão?', answer: 'Não. A conversão depende da oferta, do público, da origem do tráfego e de outros fatores. A página deve ser acompanhada com dados reais para orientar melhorias.' },
    ],
  },
  menu: {
    path: '/cardapio-digital',
    title: 'Cardápio Digital para Restaurantes',
    description: 'Cardápios digitais para restaurantes, cafés e pequenos negócios. Apresente produtos e preços em uma página acessível por link, QR Code ou placa NFC.',
    headline: 'Seu cardápio, na tela do cliente.',
    intro: 'Organize produtos e preços em um cardápio digital acessível por link, QR Code ou placa NFC.',
    label: 'Cardápio digital',
    productId: 'dev',
    overviewTitle: 'Mais clareza na hora de escolher.',
    overview: 'O cardápio digital permite apresentar categorias, itens e preços em uma página que o cliente abre no próprio celular. Pode ser compartilhado nas redes sociais, no WhatsApp ou por QR Code no estabelecimento. A NexOS desenvolve a apresentação conforme o conteúdo e a identidade do seu negócio.',
    applications: [
      { title: 'Restaurantes e lanchonetes', body: 'Apresente refeições, bebidas e acompanhamentos com descrições e preços organizados por categoria.' },
      { title: 'Cafés e confeitarias', body: 'Reúna os itens disponíveis e as informações que ajudam o cliente a escolher.' },
      { title: 'Atendimento no balcão ou na mesa', body: 'Compartilhe o endereço do cardápio por QR Code ou conecte-o a uma Placa Inteligente NexOS.' },
    ],
    preparation: ['Categorias, nomes, descrições e preços atuais dos itens.', 'Fotos dos produtos, quando disponíveis.', 'Identidade visual e informações de atendimento.', 'Forma desejada de contato ou pedido e necessidades de atualização.'],
    steps: [
      { title: 'Organizar os itens', body: 'Definimos as categorias e conferimos os materiais e preços que serão apresentados.' },
      { title: 'Montar a apresentação', body: 'Desenvolvemos a página para leitura no celular, respeitando a identidade do estabelecimento.' },
      { title: 'Compartilhar o endereço', body: 'Após a revisão, o link pode ser divulgado e conectado ao QR Code ou à placa NFC.' },
    ],
    questions: [
      { question: 'O cliente precisa instalar um aplicativo?', answer: 'Não para consultar a página. Ele abre o endereço no navegador do celular a partir do link ou QR Code. O acesso depende de conexão com a internet.' },
      { question: 'A placa NFC está incluída no cardápio?', answer: 'A placa é um produto separado. Você pode contratar o desenvolvimento do cardápio e comprar a placa para direcionar os clientes ao endereço publicado.' },
      { question: 'O cardápio recebe pedidos e pagamentos?', answer: 'Exibir um cardápio é diferente de operar um sistema de pedidos. WhatsApp, pagamento, gestão de pedidos ou outras integrações precisam ser definidos na proposta.' },
      { question: 'Como atualizo produtos e preços?', answer: 'A forma de atualização é definida no escopo do projeto. Informe a frequência das mudanças e quem ficará responsável pelos materiais antes da contratação.' },
    ],
  },
  plate: {
    path: '/placa-nfc',
    title: 'Placa NFC com QR Code para Empresas',
    description: 'Conheça a Placa Inteligente NexOS com NFC e QR Code. Direcione clientes para seu cardápio, WhatsApp, portfólio ou redes sociais por aproximação ou câmera.',
    headline: 'Aproxime. Escaneie. Conecte.',
    intro: 'Uma placa com NFC e QR Code para levar o cliente ao link que seu negócio precisa compartilhar.',
    label: 'Placa NFC + QR Code',
    productId: 'placa',
    overviewTitle: 'Do atendimento presencial ao seu link.',
    overview: 'A Placa Inteligente NexOS reúne NFC e QR Code em uma peça de acrílico. Em um celular compatível com NFC, o cliente aproxima o aparelho. Como alternativa, usa a câmera para escanear o QR Code. Os dois caminhos levam ao endereço escolhido para seu negócio, como um cardápio, portfólio ou página de contato.',
    applications: [
      { title: 'Cardápio e informações', body: 'Coloque a placa na mesa ou no balcão para compartilhar o endereço do seu cardápio digital.' },
      { title: 'WhatsApp e redes sociais', body: 'Facilite o acesso aos canais em que seus clientes já conversam com a empresa.' },
      { title: 'Portfólio e apresentação', body: 'Compartilhe seus trabalhos ou serviços na recepção, em encontros e em pontos de atendimento.' },
    ],
    preparation: ['Nome e identidade visual do negócio.', 'Endereço que a placa deve abrir.', 'Quantidade de unidades e pontos de uso.', 'CEP para cálculo do frete no checkout.'],
    steps: [
      { title: 'Escolher o destino', body: 'Defina qual link o cliente deve abrir e converse com a NexOS sobre a personalização.' },
      { title: 'Revisar o pedido', body: 'Na home, escolha a quantidade. O checkout apresenta os dados do pedido e as condições antes do pagamento.' },
      { title: 'Usar no atendimento', body: 'Posicione a placa onde o cliente possa aproximar o celular ou ler o QR Code com a câmera.' },
    ],
    questions: [
      { question: 'Funciona em qualquer celular?', answer: 'A aproximação exige um aparelho compatível com NFC e com o recurso habilitado. O QR Code oferece uma alternativa para celulares com câmera e leitura de códigos. Abrir o link depende de acesso à internet.' },
      { question: 'Posso escolher o link da placa?', answer: 'Sim. A placa pode direcionar para o endereço combinado com a NexOS, como WhatsApp, cardápio, portfólio ou redes sociais. Alinhe o destino e a personalização antes da produção.' },
      { question: 'A compra inclui a criação de um site?', answer: 'Não. A placa compartilha um link. O desenvolvimento de site ou cardápio digital é um serviço separado, caso você ainda precise criar o endereço de destino.' },
      { question: 'Há desconto para várias unidades?', answer: 'A home permite selecionar até 50 unidades e apresenta faixas de desconto a partir de 10. Confira o preço por unidade, o total e o frete antes de pagar.' },
    ],
  },
} satisfies Record<string, ServicePageContent>;
