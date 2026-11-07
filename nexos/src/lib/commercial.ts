import { config } from '@/config';

export function commercialHref(message = config.whatsapp.message): string {
  return `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function plateCommercialHref(useCase?: string): string {
  const purpose = useCase ? ` Tenho interesse no uso para ${useCase}.` : '';
  return commercialHref(`Olá! Tenho interesse na Placa Inteligente ezway com NFC + QR Code.${purpose} Podemos alinhar a personalização, o frete e as condições?`);
}
