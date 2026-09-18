import type { SiteConfig } from './types';

export const config: SiteConfig = {
  brand: {
    name: 'NexOS',
    tagline: 'Serviços Digitais de Escala',
    logo: 'NX',
    },
  
  
  hero: {
    headline: 'Construímos produtos digitais que escalam.',
    subheadline: 'Da ideia ao mercado. Desenvolvimento, design e estratégia para startups e empresas que precisam de velocidade sem abrir mão da qualidade.',
    ctaPrimary: { label: 'Iniciar Projeto', href: '#services' },
    ctaSecondary: { label: 'Ver Cases', href: '#testimonials' },
  },
  services: [
    {
      id: 'dev',
      title: 'Desenvolvimento NexOS',
      description: 'Desenvolvimento sob medida com arquitetura moderna, performance e escalabilidade.',
      price: 499.9,
      features: ['Arquitetura limpa e testável', 'CI/CD automatizado', 'Observabilidade nativa', 'Documentação técnica'],
      ctaText: 'Contratar Desenvolvimento',
    },
    {
      id: 'placa',
      title: 'Placa Inteligente NFC + QR Code',
      description: 'Placa discreta para contato rápido. Aproxime o NFC ou escaneie o QR Code e abra seu link instantaneamente.',
      price: 69.9,
      features: ['NFC e QR Code na mesma placa', 'Instalação simplificada', 'Link personalizável', 'Garantia estendida'],
      ctaText: 'Comprar Placa',
    },
    {
      id: 'teste',
      title: 'TESTE CHECKOUT',
      description: 'Produto de teste para validar o checkout Pix. Sem cobrança real — confirme com R$ 1,00 ou cancele antes de pagar.',
      price: 1.0,
      features: ['Ambiente de teste', 'Valida Pix via InfinitePay', 'Confirmação automática', 'Suporte via WhatsApp'],
      ctaText: 'Testar Checkout',
    },
  ],
  testimonials: [
    {
      id: '1',
      author: 'Marina Santos',
      role: 'CTO',
      company: 'FinTech Brazil',
      content: 'A equipe entregou nosso MVP em 6 semanas com qualidade de código que nos permitiu escalar para 100k usuários sem refatorar.',
      avatar: '/avatars/marina.svg',
    },
    {
      id: '2',
      author: 'Rafael Oliveira',
      role: 'Founder',
      company: 'EduFlow',
      content: 'O design system que criaram reduziu nosso tempo de desenvolvimento de features em 40%. ROI claro desde o mês 1.',
      avatar: '/avatars/rafael.svg',
    },
    {
      id: '3',
      author: 'Camila Rodrigues',
      role: 'VP Product',
      company: 'HealthTech Latam',
      content: 'Discovery bem feito economizou 6 meses de desenvolvimento errado. Clareza total do que construir e por quê.',
      avatar: '/avatars/camila.svg',
    },
  ],
  navigation: [
    { label: 'Serviços', href: '#services' },
    { label: 'Cases', href: '#testimonials' },
    { label: 'Contato', href: '#contact' },
  ],
  footer: {
    links: [
      { label: 'Desenvolvimento', href: '#services' },
      { label: 'Design', href: '#services' },
      { label: 'Estratégia', href: '#services' },
    ],
    legal: [
      { label: 'Política de Privacidade', href: '/privacidade' },
      { label: 'Termos de Uso', href: '/termos' },
      { label: 'LGPD', href: '/lgpd' },
      { label: 'Política de Reembolso', href: '/reembolso' },
      { label: 'Política de Cookies', href: '/cookies' },
    ],
    social: [
      { label: 'Instagram', href: 'https://www.instagram.com/_nexoslab?stkn=ODZob2M2azAwYTFz&utm_source=qr', icon: 'Instagram' },
    ],
  },
  whatsapp: {
    number: '5564993289250',
    message: 'Olá, vim pelo site da NexOS e gostaria de conversar sobre meu projeto.',
  },
  meta: {
    title: 'NexOS — Serviços Digitais de Escala',
    description: 'Desenvolvimento, design e estratégia para produtos digitais que escalam. Da ideia ao mercado com velocidade e qualidade.',
    ogImage: '/nex',
  },
};