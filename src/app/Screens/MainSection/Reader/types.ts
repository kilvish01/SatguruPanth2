import type { ContentBlock } from '../../../../services/bookContentService';

export type ReaderTheme = 'light' | 'sepia' | 'dark';

export type FontStep = 0 | 1 | 2 | 3 | 4;

export interface ReaderSettings {
  theme: ReaderTheme;
  fontStep: FontStep;
}

export interface ReaderPage {
  index: number;
  startOffset: number;
  endOffset: number;
  blocks: ContentBlock[];
}

export interface ReaderPalette {
  bg: string;
  surface: string;
  text: string;
  textSubtle: string;
  textMuted: string;
  accent: string;
  divider: string;
  controlBg: string;
  controlText: string;
}
