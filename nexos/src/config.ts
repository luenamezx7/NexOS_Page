import { diagnosticMessage } from './config/solutions';
import type { SiteConfig } from './types';

const whatsapp = {
  number: '5564993289250',
  message: diagnosticMessage,
};

export const config: SiteConfig = {
  brand: {
    name: 'ezway',
    fullName: 'ezway',
    alternateNames: [],
    tagline: 'Performance e Escala para pequenos e grandes negócios',
    logo: 'EZ',
    },
  
  
  hero: {
    headline: 'Seu negócio conectado em uma aproximação',
    subheadline: 'Converse com a EZWAY sobre organização do negócio, atendimento e presença digital para a sua realidade.',
    ctaPrimary: { label: 'Conversar sobre meu negócio', href: `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.message)}` },
    ctaSecondary: { label: 'Conhecer as soluções', href: '#ecossistema' },
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
      features: ['NFC e QR Code na mesma placa', 'Instalação simplificada', 'Link personalizável'],
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
      { label: 'Placa NFC + QR Code', href: '/#showcase' },
      { label: 'Criação de sites', href: '/#services' },
      { label: 'Landing pages', href: '/#services' },
      { label: 'Cardápio digital', href: '/#services' },
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
    title: 'EZway - Performance e Escala',
    description: 'Mais clareza para gerir. Conheça a EZWAY e converse sobre organização do negócio, atendimento, sites, portfólios, cardápios digitais e placas NFC com QR Code.',
    ogImage: '/og',
  },
};
