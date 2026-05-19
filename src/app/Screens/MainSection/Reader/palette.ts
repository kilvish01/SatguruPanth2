import type { ReaderTheme, ReaderPalette, FontStep } from './types';

// Three palettes designed for Devanagari reading: warm light (paper),
// classic sepia, and a low-glare dark. Colors tuned for long reading
// sessions — no pure black/white anywhere, all surfaces slightly tinted.

export const PALETTES: Record<ReaderTheme, ReaderPalette> = {
  light: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#1F1B16',
    textSubtle: '#6B6258',
    textMuted: '#9C9389',
    accent: '#A0522D',
    divider: '#E8E0D2',
    controlBg: 'rgba(255,255,255,0.96)',
    controlText: '#1F1B16',
  },
  sepia: {
    bg: '#F5EBD7',
    surface: '#F7E7CB',
    text: '#3D2E1F',
    textSubtle: '#7A6042',
    textMuted: '#A48965',
    accent: '#8C3A1F',
    divider: '#E0D0B0',
    controlBg: 'rgba(247,231,203,0.96)',
    controlText: '#3D2E1F',
  },
  dark: {
    bg: '#15110D',
    surface: '#1F1A14',
    text: '#EFE4D2',
    textSubtle: '#B5A98E',
    textMuted: '#7A6F5A',
    accent: '#E0A66B',
    divider: '#332B21',
    controlBg: 'rgba(31,26,20,0.96)',
    controlText: '#EFE4D2',
  },
};

// Font scale per step. Tuned so that step 2 (default) produces ~14-15
// lines per page on a typical 360x640 reading area with Devanagari.
export const FONT_SIZES: Record<FontStep, { body: number; lineHeight: number }> = {
  0: { body: 14, lineHeight: 24 },
  1: { body: 16, lineHeight: 28 },
  2: { body: 18, lineHeight: 32 },
  3: { body: 21, lineHeight: 36 },
  4: { body: 24, lineHeight: 41 },
};
