/** Shared color values for server-rendered artwork and canvas effects. CSS theme tokens mirror these. */
export const SITE_PALETTE = {
  background: '#07050d',
  surface: '#0e0a1a',
  card: '#161027',
  elevated: '#1f1737',
  border: '#2a2045',
  action: '#7c3aed',
  actionHover: '#8b5cf6',
  cta: '#b6ff3b',
  highlight: '#c4a8ff',
  ink: '#f5f3ff',
  muted: '#b8b0d0',
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
  light: [SITE_PALETTE.background, '#2e1065', '#5b21b6', VISOR_PALETTE.violet, SITE_PALETTE.highlight],
  dark: [SITE_PALETTE.background, '#2e1065', '#5b21b6', VISOR_PALETTE.violet, SITE_PALETTE.highlight],
};
