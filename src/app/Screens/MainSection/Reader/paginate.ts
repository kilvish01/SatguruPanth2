// Client-side paginator: walks the flat block list and packs blocks into
// "pages" sized for the current screen + font step. Estimates block heights
// based on text length / character-width. Not pixel-perfect — but close
// enough for natural-feeling page boundaries. Re-runs whenever font size
// or container dimensions change.

import type { ContentBlock } from '../../../../services/bookContentService';
import type { ReaderPage, FontStep } from './types';
import { FONT_SIZES } from './palette';

interface PaginateArgs {
  blocks: ContentBlock[];
  fontStep: FontStep;
  pageWidth: number;     // inner content width in px
  pageHeight: number;    // inner content height in px
}

// Avg width of a Devanagari glyph relative to body font size. Empirically
// ~0.55 with Hindi-friendly fonts at the sizes we use; tuned to feel right
// rather than be pixel-precise.
const CHAR_WIDTH_RATIO = 0.55;
const VERSE_LINE_PAD = 1.18;     // verses get a bit more breathing room

function estimateBlockHeight(b: ContentBlock, body: number, lineHeight: number, charsPerLine: number): number {
  const text = b.text || '';

  // Heading sizes proportional to body so the relative hierarchy stays
  // intact across all font steps.
  if (b.type === 'heading') {
    const sizeMul = b.level === 1 ? 1.7 : b.level === 2 ? 1.35 : 1.15;
    const h = body * sizeMul;
    const lh = h * 1.3;
    const lines = Math.max(1, Math.ceil((text.length || 1) / Math.max(8, Math.floor(charsPerLine / sizeMul))));
    return lines * lh + (b.level === 1 ? 28 : 18); // margin
  }

  if (b.type === 'verse') {
    const verseLines = text.split('\n').length;
    return verseLines * lineHeight * VERSE_LINE_PAD + 16;
  }

  if (b.type === 'image') {
    // Reserve a generous slot; the renderer constrains to maxWidth.
    return pageHeightForImage();
  }

  if (b.type === 'list_item') {
    const lines = Math.max(1, Math.ceil(text.length / Math.max(8, charsPerLine - 4)));
    return lines * lineHeight + 6;
  }

  if (b.type === 'image_caption') {
    return lineHeight + 6;
  }

  if (b.type === 'footer') {
    // Reader filters footers out at render time, but pagination still
    // counts a tiny placeholder so offsets stay accurate.
    return 0;
  }

  // paragraph + fallback
  const lines = Math.max(1, Math.ceil(text.length / Math.max(8, charsPerLine)));
  return lines * lineHeight + 8; // margin
}

function pageHeightForImage(): number {
  // Static slot; could be refined once we know aspect ratio.
  return 240;
}

export function paginate({ blocks, fontStep, pageWidth, pageHeight }: PaginateArgs): ReaderPage[] {
  const { body, lineHeight } = FONT_SIZES[fontStep];
  const charsPerLine = Math.max(10, Math.floor(pageWidth / (body * CHAR_WIDTH_RATIO)));

  // Filter footers — keep their offset in the *first* page so progress %
  // doesn't get thrown off, but they don't render.
  const renderable = blocks.filter((b) => b.type !== 'footer');

  const pages: ReaderPage[] = [];
  let current: ContentBlock[] = [];
  let currentHeight = 0;
  let pageIndex = 0;

  const flush = () => {
    if (current.length === 0) return;
    pages.push({
      index: pageIndex++,
      startOffset: current[0].offset,
      endOffset: current[current.length - 1].offset + (current[current.length - 1].text?.length || 0),
      blocks: current,
    });
    current = [];
    currentHeight = 0;
  };

  for (const block of renderable) {
    const h = estimateBlockHeight(block, body, lineHeight, charsPerLine);

    // A single block bigger than a page (long verse / huge paragraph) just
    // takes its own page rather than getting split — splitting reflowable
    // verse mid-stanza looks awful.
    if (h > pageHeight && current.length === 0) {
      pages.push({
        index: pageIndex++,
        startOffset: block.offset,
        endOffset: block.offset + (block.text?.length || 0),
        blocks: [block],
      });
      continue;
    }

    if (currentHeight + h > pageHeight && current.length > 0) {
      flush();
    }

    current.push(block);
    currentHeight += h;
  }

  flush();
  return pages;
}

// Given a target char offset (e.g. resume from where the user left off),
// find the page index that contains it.
export function pageForOffset(pages: ReaderPage[], offset: number): number {
  if (!pages.length) return 0;
  // Linear scan is fine; books here have hundreds of pages max.
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].endOffset > offset) return i;
  }
  return pages.length - 1;
}
