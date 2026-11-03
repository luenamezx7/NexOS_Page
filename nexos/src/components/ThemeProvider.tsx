'use client';

/** The site has one brand palette. Keep this accessor for existing visual components. */
export function useTheme(): { theme: 'dark' } {
  return { theme: 'dark' };
}
