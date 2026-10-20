import type { SiteConfig } from './types';

export const config: SiteConfig = {
  brand: {
    name: 'NexOS',
    fullName: 'NexOS Lab',
    alternateNames: ['NexOS Performance'],
    tagline: 'Serviços Digitais de Escala',
    logo: 'NX',
    },
  
  
  hero: {
    headline: 'Construímos soluções digitais para seu negócio.',
    subheadline: 'Da ideia ao mercado. Desenvolvimento, design e estratégia para startups e empresas que precisam de velocidade sem abrir mão da qualidade.',
    ctaPrimary: { label: 'Iniciar Projeto', href: '#services' },
    ctaSecondary: { label: 'Sobre Nós', href: '#testimonials' },
  },
  services: [
    {
      id: 'dev',
      title: 'Desenvolvimento NexOS',
      description: 'Seu negócio merece uma presença digital que explique o que você faz e facilite o próximo contato. Criamos sites, portfólios, cardápios digitais e landing pages com a sua identidade, navegação clara e foco no seu objetivo.',
      features: ['Sites e portfólios para apresentar sua marca', 'Cardápios digitais fáceis de consultar', 'Landing pages para suas campanhas', 'Experiência adaptada ao celular', 'Design e desenvolvimento sob medida', 'Escopo e entrega alinhados com você'],
      ctaText: 'Falar com o comercial',
    },
    {
      id: 'placa',
      title: 'Placa Inteligente NFC + QR Code',
      description: 'Placa discreta para contato rápido. Aproxime o NFC ou escaneie o QR Code e abra seu link instantaneamente.',
      features: ['NFC e QR Code na mesma placa', 'Instalação simplificada', 'Link personalizável', 'Garantia estendida'],
      ctaText: 'Adquirir Placa',
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
    { label: 'Sobre Nós', href: '#testimonials' },
    { label: 'Contato', href: '#cta-final' },
  ],
  footer: {
    links: [
      { label: 'Criação de sites', href: '/criacao-de-sites' },
      { label: 'Landing pages', href: '/landing-pages' },
      { label: 'Cardápio digital', href: '/cardapio-digital' },
      { label: 'Placa NFC + QR Code', href: '/placa-nfc' },
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
    title: 'Criação de Sites, Landing Pages e Placas NFC',
    description: 'NexOS Lab, também conhecida como NexOS Performance: sites, landing pages e cardápios digitais para empresas. Placas NFC com QR Code para seu atendimento.',
    ogImage: '/og',
  },
};
