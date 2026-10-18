export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDoc {
  slug: 'privacidade' | 'termos' | 'lgpd' | 'reembolso' | 'cookies';
  tab: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'privacidade',
    tab: 'Privacidade',
    title: 'Política de Privacidade',
    updated: 'Atualizado em setembro de 2026',
    intro:
      'Esta Política descreve como a NexOS coleta, usa e protege dados pessoais no site, na sua conta e nas conversas com nosso atendimento comercial.',
    sections: [
      {
        heading: '1. Dados que coletamos',
        body: 'Tratamos os dados necessários para sua conta e os que você compartilha com nosso atendimento, como nome, e-mail, empresa, interesse e mensagem. A contratação é alinhada diretamente com o comercial pelo WhatsApp ou e-mail.',
      },
      {
        heading: '2. Finalidades',
        body: 'Usamos os dados para responder contatos, preparar propostas, executar os serviços contratados, proteger sua conta e melhorar o produto.',
      },
      {
        heading: '3. Compartilhamento',
        body: 'Utilizamos fornecedores de infraestrutura e comunicação conforme necessário para manter o site e atender você. Ao abrir o WhatsApp, também se aplicam as políticas desse serviço. Não vendemos dados pessoais.',
      },
      {
        heading: '4. Retenção e direitos',
        body: 'Mantemos contatos pelo tempo necessário à relação comercial. Você pode solicitar acesso, correção ou exclusão pelo e-mail nexosperformance@gmail.com.',
      },
    ],
  },
  {
    slug: 'termos',
    tab: 'Termos',
    title: 'Termos de Uso',
    updated: 'Atualizado em setembro de 2026',
    intro:
      'Ao usar o site e contratar Desenvolvimento NexOS ou a Placa Inteligente NFC + QR Code, você concorda com estes Termos.',
    sections: [
      {
        heading: '1. Serviços',
        body: 'Desenvolvimento sob medida (arquitetura limpa, CI/CD, observabilidade) e placas físicas com NFC + QR Code (envio em até 3 dias úteis após confirmação).',
      },
      {
        heading: '2. Contratação comercial',
        body: 'A aquisição de placas e a contratação de desenvolvimento são concluídas diretamente com nosso comercial. Quantidade, personalização, escopo, frete, prazos e condições de pagamento são confirmados durante o atendimento. Os valores apresentados no site orientam a conversa comercial.',
      },
      {
        heading: '3. Uso aceitável',
        body: 'É vedado tentar burlar os mecanismos de segurança do site, enviar dados maliciosos ou usar marcas NexOS sem autorização.',
      },
      {
        heading: '4. Suporte',
        body: 'Suporte via WhatsApp +55 64 99328-9250 e e-mail nexosperformance@gmail.com. Prazo de kickoff de desenvolvimento: 48h.',
      },
    ],
  },
  {
    slug: 'lgpd',
    tab: 'LGPD',
    title: 'LGPD — Direitos do Titular',
    updated: 'Atualizado em setembro de 2026 · Lei nº 13.709/2018',
    intro:
      'A NexOS atua como controladora dos dados da sua conta e dos dados compartilhados com nosso atendimento comercial.',
    sections: [
      {
        heading: '1. Bases legais',
        body: 'Consentimento, procedimentos preliminares e execução de contrato (atendimento, contratação e entrega) e legítimo interesse (prevenção a fraude e segurança), conforme a finalidade do tratamento.',
      },
      {
        heading: '2. Seus direitos',
        body: 'Confirmação, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento — responda em até 15 dias via nexosperformance@gmail.com.',
      },
      {
        heading: '3. Segurança',
        body: 'Aplicamos controles de acesso, validação de dados e proteção das requisições. O site não oferece uma etapa de pagamento online; as condições são alinhadas com nosso comercial.',
      },
      {
        heading: '4. Encarregado (DPO)',
        body: 'Encarregado: NexOS Performance — nexosperformance@gmail.com — WhatsApp +55 64 99328-9250.',
      },
    ],
  },
  {
    slug: 'reembolso',
    tab: 'Reembolso',
    title: 'Política de Reembolso',
    updated: 'Atualizado em setembro de 2026',
    intro:
      'Transparência total: regras claras para desenvolvimento e para a Placa Inteligente, incluindo frete calculado de acordo com sua região.',
    sections: [
      {
        heading: '1. Placa Inteligente NFC + QR Code',
        body: 'Arrependimento em até 7 dias corridos (art. 49 do CDC) para produtos não personalizados. Defeito de fabricação: troca ou reembolso integral em até 30 dias. Frete de devolução por defeito é por nossa conta; por arrependimento, calculamos o frete de acordo com sua região.',
      },
      {
        heading: '2. Desenvolvimento NexOS',
        body: 'Sinal/kickoff não reembolsável após início do Discovery. Entregas incrementais: reembolso proporcional às sprints não executadas.',
      },
      {
        heading: '3. Como solicitar',
        body: 'Abra o pedido via WhatsApp +55 64 99328-9250 ou nexosperformance@gmail.com com os dados da contratação e o comprovante de pagamento. Prazo de análise: 5 dias úteis; estorno no mesmo método de pagamento em até 10 dias úteis.',
      },
      {
        heading: '4. Exceções',
        body: 'Placas personalizadas (link gravado a pedido) não são elegíveis a arrependimento, apenas a garantia contra defeitos.',
      },
    ],
  },
  {
    slug: 'cookies',
    tab: 'Cookies',
    title: 'Política de Cookies',
    updated: 'Atualizado em setembro de 2026 · LGPD Lei nº 13.709/2018',
    intro:
      'Usamos apenas o essencial para o site funcionar (tema, consentimento) e deixamos analytics/marketing desligados por padrão. Você pode aceitar, recusar ou personalizar — e mudar de ideia quando quiser.',
    sections: [
      {
        heading: '1. O que usamos',
        body: 'Estritamente necessários (sempre ativos): nexos-theme (tema claro/escuro) e nexos-cookie-consent-v1 (sua escolha de cookies, 12 meses). Sem eles o site não lembra suas preferências.',
      },
      {
        heading: '2. Opcionais (só com seu consentimento)',
        body: 'Funcionais (Lenis/suavidade de scroll), Analytics (medição de visitas, ex. Vercel Analytics/GA4 — hoje desligado por padrão) e Marketing (pixels de remarketing — hoje desligado por padrão). Nada disso roda antes do aceite.',
      },
      {
        heading: '3. Terceiros',
        body: 'Links externos, como o WhatsApp comercial, seguem as políticas próprias dos respectivos serviços. Não vendemos dados.',
      },
      {
        heading: '4. Gerenciar',
        body: 'Use o botão "Gerenciar cookies" no rodapé ou o banner para aceitar tudo, recusar tudo ou salvar por categoria. Dúvidas: nexosperformance@gmail.com.',
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc {
  return LEGAL_DOCS.find((d) => d.slug === slug) ?? LEGAL_DOCS[0];
}
