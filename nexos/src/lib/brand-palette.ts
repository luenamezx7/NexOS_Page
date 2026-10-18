/** Sampled from the `mirror` gradient of design-/mascote_lobo_header_capuz.svg. */
export const VISOR_PALETTE = {
  violet: '#3328bc',
  blue: '#005dda',
  cyan: '#0bd2d3',
  mint: '#95e9da',
  gold: '#ffe36b',
  orange: '#ff913e',
  coral: '#fc3768',
  magenta: '#e6008b',
  plum: '#650c66',
} as const;

export const TOPOGRAPHY_PALETTE = {
  lowColor: VISOR_PALETTE.blue,
  midColor: VISOR_PALETTE.cyan,
  highColor: '#fdf6ec',
};

export const HERO_PALETTES = {
  light: [VISOR_PALETTE.blue, VISOR_PALETTE.cyan, VISOR_PALETTE.gold, VISOR_PALETTE.coral, VISOR_PALETTE.magenta],
  dark: [VISOR_PALETTE.violet, VISOR_PALETTE.blue, VISOR_PALETTE.cyan, VISOR_PALETTE.gold, VISOR_PALETTE.orange, VISOR_PALETTE.coral, VISOR_PALETTE.magenta],
};

export const WAVES_PALETTE = ['#170b25', VISOR_PALETTE.violet, VISOR_PALETTE.blue, VISOR_PALETTE.cyan,
  VISOR_PALETTE.gold, VISOR_PALETTE.orange, VISOR_PALETTE.coral, VISOR_PALETTE.magenta];
