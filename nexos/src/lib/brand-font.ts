import localFont from 'next/font/local';

/** Shared wordmark face for the header and the opening presentation. */
export const raithonRealm = localFont({
  src: '../../design-/FONTES/raithon_realm/Raithon Realm Trial.otf',
  variable: '--font-brand-logo',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
});
