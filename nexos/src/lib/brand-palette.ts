/** Shared color values for server-rendered artwork and canvas effects. CSS theme tokens mirror these. */
export const SITE_PALETTE = {
  background: '#050606',
  surface: '#0d0f0d',
  card: '#151815',
  elevated: '#202420',
  border: '#343b32',
  action: '#94e01f',
  actionHover: '#b6ff3b',
  cta: '#b6ff3b',
  highlight: '#c8ff66',
  ink: '#f7faf6',
  muted: '#bac4b7',
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
  light: [SITE_PALETTE.background, '#202420', '#343b32', VISOR_PALETTE.violet, SITE_PALETTE.highlight],
  dark: [SITE_PALETTE.background, '#202420', '#343b32', VISOR_PALETTE.violet, SITE_PALETTE.highlight],
};
