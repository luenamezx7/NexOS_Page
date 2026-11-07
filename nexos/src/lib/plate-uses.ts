/** Public, safe demonstration destinations — not customer plates or managed redirects. */
export const PLATE_USES = [
  {
    id: 'menu', name: 'Cardápio digital', caption: 'Seu cardápio na mesa.',
    description: 'Seu cliente aproxima ou escaneia a placa para consultar pratos, preços e informações no celular.',
    demoUrl: 'https://nexoslab.online/cardapio-digital',
  },
  {
    id: 'instagram', name: 'Instagram', caption: 'Seu perfil a um gesto.',
    description: 'Leve quem está no seu espaço ao Instagram da marca para conhecer seu trabalho e acompanhar as novidades.',
    demoUrl: 'https://www.instagram.com/_nexoslab/',
  },
  {
    id: 'whatsapp', name: 'WhatsApp', caption: 'Uma conversa mais perto.',
    description: 'Abra uma conversa com seu negócio para tirar dúvidas, fazer pedidos ou agendar.',
    demoUrl: 'https://wa.me/5564993289250?text=Ola%21%20Conheci%20a%20ezway%20pela%20placa%20e%20gostaria%20de%20saber%20mais.',
  },
  {
    id: 'google', name: 'Google', caption: 'Seu negócio fácil de encontrar.',
    description: 'Direcione para seu Perfil da Empresa no Google, onde o cliente pode consultar localização, horários e avaliações.',
    demoUrl: 'https://www.google.com/maps/search/?api=1&query=ezway',
  },
] as const;

export type PlateUse = (typeof PLATE_USES)[number];
