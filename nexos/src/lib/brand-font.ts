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

/** Shared variable family for the ezway logo lockup. */
export const unbounded = localFont({
  src: '../../design-/FONTES/unbounded/Unbounded-VariableFont_wght.ttf',
  variable: '--font-header-logo',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  preload: false,
});
