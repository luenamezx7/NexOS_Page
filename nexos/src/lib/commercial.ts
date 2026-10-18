import { config } from '@/config';

export function commercialHref(message = config.whatsapp.message): string {
  return `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function plateCommercialHref(quantity = 1): string {
  return commercialHref(`Olá! Quero adquirir ${quantity} ${quantity === 1 ? 'Placa Inteligente NexOS' : 'Placas Inteligentes NexOS'} com NFC + QR Code. Podemos alinhar a personalização, o frete e as condições para fechar o pedido?`);
}
