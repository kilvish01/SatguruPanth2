export const lightTheme = {
  mode: 'light' as const,

  bg: '#FAF8F3',
  bgElevated: '#FFFFFF',
  bgGlass: 'rgba(255, 255, 255, 0.72)',
  bgOverlay: 'rgba(0, 0, 0, 0.04)',

  surface: '#FFFFFF',
  surfaceMuted: '#F4F1EA',
  surfaceHover: '#EFEBE0',

  text: '#1A1814',
  textMuted: '#6B6660',
  textSubtle: '#9B968F',
  textInverted: '#FFFFFF',

  primary: '#C8932B',
  primaryHover: '#B07F1F',
  primaryMuted: '#F5E9CC',
  primaryFg: '#FFFFFF',

  accent: '#CF551F',
  accentMuted: '#FCE4D6',

  success: '#2D7D5C',
  warning: '#D4920E',
  danger: '#DC4A3A',
  dangerMuted: '#FCE4E0',

  border: '#E8E2D5',
  borderStrong: '#D4CBB8',
  divider: '#EFEBE0',

  shadow: 'rgba(20, 14, 6, 0.08)',
  shadowStrong: 'rgba(20, 14, 6, 0.18)',

  gradientPrimary: ['#C8932B', '#E5B53E'] as [string, string],
  gradientAccent: ['#CF551F', '#E87A4A'] as [string, string],
  gradientHero: ['#1A1814', '#3A2E1E'] as [string, string],
  gradientSubtle: ['#FAF8F3', '#F4F1EA'] as [string, string],
};

export const darkTheme: typeof lightTheme = {
  mode: 'dark' as any,

  bg: '#0E0C09',
  bgElevated: '#181613',
  bgGlass: 'rgba(24, 22, 19, 0.72)',
  bgOverlay: 'rgba(255, 255, 255, 0.04)',

  surface: '#181613',
  surfaceMuted: '#22201C',
  surfaceHover: '#2C2925',

  text: '#F5F1E8',
  textMuted: '#A8A398',
  textSubtle: '#6B665E',
  textInverted: '#0E0C09',

  primary: '#E5B53E',
  primaryHover: '#F0C957',
  primaryMuted: '#3A2E14',
  primaryFg: '#0E0C09',

  accent: '#E87A4A',
  accentMuted: '#3A1F12',

  success: '#5BBF8F',
  warning: '#F0B83A',
  danger: '#F08070',
  dangerMuted: '#3A1F1A',

  border: '#2C2925',
  borderStrong: '#3D3A35',
  divider: '#22201C',

  shadow: 'rgba(0, 0, 0, 0.40)',
  shadowStrong: 'rgba(0, 0, 0, 0.60)',

  gradientPrimary: ['#E5B53E', '#C8932B'] as [string, string],
  gradientAccent: ['#E87A4A', '#CF551F'] as [string, string],
  gradientHero: ['#0E0C09', '#22201C'] as [string, string],
  gradientSubtle: ['#181613', '#0E0C09'] as [string, string],
};

export type ThemeColors = typeof lightTheme;
