/** Shared color values for server-rendered artwork and canvas effects. CSS theme tokens mirror these. */
export const SITE_PALETTE = {
  background: '#09070c',
  surface: '#110e15',
  card: '#19151d',
  elevated: '#28212c',
  border: '#453747',
  action: '#e6197d',
  actionHover: '#ff3f9f',
  cta: '#ff3f9f',
  highlight: '#fbf7fa',
  ink: '#fbf7fa',
  muted: '#c9bbc9',
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
  light: [SITE_PALETTE.background, SITE_PALETTE.elevated, SITE_PALETTE.border, VISOR_PALETTE.violet, SITE_PALETTE.highlight],
  dark: [SITE_PALETTE.background, SITE_PALETTE.elevated, SITE_PALETTE.border, VISOR_PALETTE.violet, SITE_PALETTE.highlight],
};
