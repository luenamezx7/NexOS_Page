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
      'Esta Política descreve como a NexOS coleta, usa e protege dados pessoais no site, no checkout transparente (Stripe) e no formulário de contato (Notion).',
    sections: [
      {
        heading: '1. Dados que coletamos',
        body: 'Coletamos nome, e-mail, empresa, serviço de interesse e mensagem via /api/contact, além de e-mail para recibo e dados de pagamento processados exclusivamente pelo Stripe em iFrame isolado (PCI-DSS). Nenhum dado de cartão toca nossos servidores.',
      },
      {
        heading: '2. Finalidades',
        body: 'Usamos os dados para responder contatos, emitir recibos, processar pagamentos via Stripe Checkout Sessions, prevenir fraude (rate limit de 8 req/min por IP) e melhorar o produto.',
      },
      {
        heading: '3. Compartilhamento',
        body: 'Compartilhamos dados estritamente com Stripe (pagamentos) e Notion (CRM de contatos). Não vendemos dados pessoais.',
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
        heading: '2. Checkout',
        body: 'Pagamentos via Stripe Checkout Sessions (Pix e cartão). O allowlist de priceId é validado no servidor; valores vêm do Price do Stripe, nunca do client.',
      },
      {
        heading: '3. Uso aceitável',
        body: 'É vedado tentar burlar rate limit, injetar payloads inválidos em /api/checkout ou /api/contact, ou usar marcas NexOS sem autorização.',
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
      'A NexOS atua como controladora dos dados enviados pelo formulário e como operadora parcial no checkout (controlado pelo Stripe).',
    sections: [
      {
        heading: '1. Bases legais',
        body: 'Consentimento (formulário), execução de contrato (pagamento e entrega) e legítimo interesse (prevenção a fraude e segurança).',
      },
      {
        heading: '2. Seus direitos',
        body: 'Confirmação, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento — responda em até 15 dias via nexosperformance@gmail.com.',
      },
      {
        heading: '3. Segurança',
        body: 'CSP restritiva (frame-src js.stripe.com), X-Content-Type-Options, rate limiting em memória, validação zod e iFrame PCI-DSS. Nenhum PAN/CVV é persistido.',
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
        body: 'Sinal/kickoff não reembolsável após início do Discovery. Entregas incrementais: reembolso proporcional às sprints não executadas, descontadas taxas do Stripe.',
      },
      {
        heading: '3. Como solicitar',
        body: 'Abra o pedido via WhatsApp +55 64 99328-9250 ou nexosperformance@gmail.com com session_id do Stripe. Prazo de análise: 5 dias úteis; estorno via Stripe em até 10 dias úteis.',
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
        body: 'Stripe (js.stripe.com, checkout/pagamento) e fontes Google carregam apenas dentro do seu contexto (checkout ou fontes) e seguem as políticas próprias. Não vendemos dados.',
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
