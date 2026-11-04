/** Shared color values for server-rendered artwork and canvas effects. CSS theme tokens mirror these. */
export const SITE_PALETTE = {
  background: '#09090f',
  surface: '#15121f',
  border: '#2c253c',
  action: '#7c3aed',
  actionHover: '#6d28d9',
  cta: '#ff168d',
  highlight: '#c4b5fd',
  ink: '#f5f3ff',
  muted: '#aba6ba',
} as const;

export const VISOR_PALETTE = {
  violet: SITE_PALETTE.action,
  lilac: SITE_PALETTE.highlight,
  plum: SITE_PALETTE.surface,
} as const;

export const TOPOGRAPHY_PALETTE = {
  lowColor: VISOR_PALETTE.violet,
  midColor: VISOR_PALETTE.lilac,
  highColor: SITE_PALETTE.ink,
};

export const HERO_PALETTES = {
  light: [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac, VISOR_PALETTE.violet, VISOR_PALETTE.plum],
  dark: [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac, VISOR_PALETTE.violet, VISOR_PALETTE.plum],
};

export const WAVES_PALETTE = [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac,
  VISOR_PALETTE.violet, VISOR_PALETTE.plum];

/** Subtle theme ramps for decorative effects. */
export const GRAINIENT_PALETTES = {
  light: ['#fdf6ec', '#eddbfa', '#cd9af4', VISOR_PALETTE.violet, '#7410c4'],
  dark: [SITE_PALETTE.background, SITE_PALETTE.surface, SITE_PALETTE.actionHover, VISOR_PALETTE.violet, SITE_PALETTE.highlight],
};
