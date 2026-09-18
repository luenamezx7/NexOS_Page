export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  ctaText: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    logo: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
  services: Service[];
  testimonials: Testimonial[];
  navigation: NavItem[];
  footer: {
    links: FooterLink[];
    legal: FooterLink[];
    social: { label: string; href: string; icon: string }[];
  };
  whatsapp: {
    number: string;
    message: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage: string;
  };
}