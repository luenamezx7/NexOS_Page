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
      title: 'Desenvolvimento Full-Stack',
      description: 'Aplicações web e mobile modernas, performáticas e escaláveis. React, Next.js, TypeScript, Node.js.',
      price: 15000,
      features: ['Arquitetura limpa e testável', 'CI/CD automatizado', 'Observabilidade nativa', 'Documentação técnica'],
      ctaText: 'Contratar Desenvolvimento',
      stripePriceId: 'price_dev_fullstack',
    },
    {
      id: 'design',
      title: 'Product Design & Branding',
      description: 'Interfaces que convertem. Design system, prototipagem, pesquisa de usuário e identidade visual.',
      price: 8000,
      features: ['Design System completo', 'Protótipos navegáveis', 'Testes de usabilidade', 'Guidelines de marca'],
      ctaText: 'Contratar Design',
      stripePriceId: 'price_design_branding',
    },
    {
      id: 'strategy',
      title: 'Estratégia & Discovery',
      description: 'Validação de produto, roadmap técnico, métricas de sucesso e go-to-market para seu MVP.',
      price: 5000,
      features: ['Product Discovery', 'Mapeamento de riscos', 'KPIs & North Star', 'Plano de execução 90 dias'],
      ctaText: 'Agendar Discovery',
      stripePriceId: 'price_strategy_discovery',
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
    ],
    social: [
      { label: 'GitHub', href: 'https://github.com/nexos', icon: 'GitBranch' },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/nexos', icon: 'Building2' },
      { label: 'Twitter', href: 'https://twitter.com/nexos', icon: 'MessageSquare' },
    ],
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    successUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cancelado`,
  },
  whatsapp: {
    number: '5511999999999',
    message: 'Olá, vim pelo site da NexOS e gostaria de conversar sobre meu projeto.',
  },
  meta: {
    title: 'NexOS — Serviços Digitais de Escala',
    description: 'Desenvolvimento, design e estratégia para produtos digitais que escalam. Da ideia ao mercado com velocidade e qualidade.',
    ogImage: '/nex',
  },
};