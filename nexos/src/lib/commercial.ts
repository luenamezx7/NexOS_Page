import { config } from '@/config';

export function commercialHref(message = config.whatsapp.message): string {
  return `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function plateCommercialHref(useCase?: string, translate: (text: string) => string = text => text): string {
  const purpose = useCase ? ` ${translate('Tenho interesse no uso para')} ${translate(useCase)}.` : '';
  return commercialHref(`${translate('Olá! Tenho interesse na Placa Inteligente ezway com NFC + QR Code.')}${purpose} ${translate('Podemos alinhar a personalização, o frete e as condições?')}`);
}
