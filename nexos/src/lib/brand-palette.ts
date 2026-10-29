/** Sampled from the glasses in design-/img-ref/mascote_lobo_roxo.svg. */
export const VISOR_PALETTE = {
  violet: '#971ef4',
  lilac: '#e873f8',
  plum: '#34064e',
} as const;

export const TOPOGRAPHY_PALETTE = {
  lowColor: VISOR_PALETTE.violet,
  midColor: VISOR_PALETTE.lilac,
  highColor: '#fdf6ec',
};

export const HERO_PALETTES = {
  light: [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac, VISOR_PALETTE.violet, VISOR_PALETTE.plum],
  dark: [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac, VISOR_PALETTE.violet, VISOR_PALETTE.plum],
};

export const WAVES_PALETTE = [VISOR_PALETTE.plum, VISOR_PALETTE.violet, VISOR_PALETTE.lilac,
  VISOR_PALETTE.violet, VISOR_PALETTE.plum];

/** Explicit theme ramps keep the cream canvas instead of lightMode's pure white. */
export const GRAINIENT_PALETTES = {
  light: ['#eee5d8', '#e4d5e9', '#c8a4e0', VISOR_PALETTE.violet, '#7410c4'],
  dark: ['#000000', '#26073e', '#57118c', VISOR_PALETTE.violet, '#a331f7'],
};
