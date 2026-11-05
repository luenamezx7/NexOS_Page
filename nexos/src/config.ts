import type { SiteConfig } from './types';

const whatsapp = {
  number: '5564993289250',
  message: 'Olá, vim pelo site da ezway e gostaria de conversar sobre meu projeto.',
};

export const config: SiteConfig = {
  brand: {
    name: 'ezway',
    fullName: 'ezway',
    alternateNames: [],
    tagline: 'Serviços Digitais de Escala',
    logo: 'EZ',
    },
  
  
  hero: {
    headline: 'Construímos soluções digitais para seu negócio.',
    subheadline: 'Da ideia ao mercado. Desenvolvimento, design e estratégia para startups e empresas que precisam de velocidade sem abrir mão da qualidade.',
    ctaPrimary: { label: 'Entrar em contato', href: `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.message)}` },
    ctaSecondary: { label: 'Sobre Nós', href: '#testimonials' },
  },
  services: [
    {
      id: 'dev',
      title: 'Desenvolvimento ezway',
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
  navigation: [
    { label: 'Placa NFC + QR Code', href: '#showcase' },
    { label: 'Serviços', href: '#services' },
    { label: 'Sobre Nós', href: '#testimonials' },
    { label: 'Contato', href: '#cta-final' },
  ],
  footer: {
    links: [
      { label: 'Placa NFC + QR Code', href: '/placa-nfc' },
      { label: 'Criação de sites', href: '/criacao-de-sites' },
      { label: 'Landing pages', href: '/landing-pages' },
      { label: 'Cardápio digital', href: '/cardapio-digital' },
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
  whatsapp,
  meta: {
    title: 'Placa Inteligente NFC + QR Code e Soluções Digitais',
    description: 'Conecte seu negócio do balcão ao digital com a Placa Inteligente NFC + QR Code da ezway. Use seu endereço ou desenvolva um site, cardápio digital ou landing page à parte.',
    ogImage: '/og',
  },
};
