// Canonical schema for an extracted book.
//
// Every PDF in our library is converted into one of these JSON blobs by the
// AI extraction pipeline. The reflowable reader on the client consumes this
// shape directly — so any field added here must be considered a public API
// change for the reader.
//
// Design notes:
//   - `blocks` is an ordered, flat list. The client paginates by font-size +
//     screen-size at render time, NOT by the producer.
//   - `offset` is a character-count cursor from the start of the book. We use
//     it as a stable progress marker (independent of font size or pagination).
//   - Images are referenced by S3 key. The image files are uploaded separately
//     to the same CONTENT_BUCKET under `books/<bookId>/images/<n>.<ext>`.
//   - Verses (दोहा / चौपाई / श्लोक) are a distinct block type so the reader
//     can render them centered with preserved line breaks.

const { z } = require('zod');

const BlockType = z.enum([
  'heading',       // h1/h2/h3 — `level` field carries depth
  'paragraph',     // body text
  'verse',         // दोहा / चौपाई / श्लोक — preserve line breaks
  'image',         // standalone embedded illustration
  'image_caption', // caption beneath an image
  'footer',        // page number / running footer — usually filtered out
  'list_item',     // bullet/numbered list item
]);

const Block = z.object({
  type: BlockType,
  offset: z.number().int().nonnegative(),

  // Body fields — at least one of `text` or `imageKey` must be present.
  text: z.string().optional(),
  imageKey: z.string().optional(),

  // Optional styling hints.
  level: z.number().int().min(1).max(4).optional(),     // for headings only
  align: z.enum(['left', 'center', 'right']).optional(),
  emphasis: z.boolean().optional(),

  // Provenance for QA — which source PDF page this block came from.
  sourcePage: z.number().int().positive(),
}).refine(
  (b) => Boolean(b.text || b.imageKey),
  { message: 'Block must have either text or imageKey' }
);

const Chapter = z.object({
  id: z.string(),
  title: z.string(),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  sourceStartPage: z.number().int().positive(),
});

const BookContent = z.object({
  schemaVersion: z.literal('1.0'),
  bookId: z.string(),
  title: z.string(),
  language: z.literal('hi'),

  // Totals — computed by the extraction driver, NOT by the AI.
  totalBlocks: z.number().int().nonnegative(),
  totalChars: z.number().int().nonnegative(),
  totalSourcePages: z.number().int().positive(),
  estimatedReadingMinutes: z.number().int().nonnegative(),

  extraction: z.object({
    method: z.literal('claude-vision'),
    model: z.string(),               // e.g. "claude-sonnet-4-6"
    promptVersion: z.string(),       // bump when prompt changes
    extractedAt: z.string(),         // ISO-8601
    pagesExtracted: z.number().int(),
    pagesFailed: z.number().int(),
    qaStatus: z.enum(['pending', 'ready', 'needs_review', 'failed']),
  }),

  chapters: z.array(Chapter),
  blocks: z.array(Block),
});

// Per-page output from the AI — what we ask Claude to return for ONE page.
// The driver merges these into the canonical BookContent above.
const PageExtraction = z.object({
  pageNumber: z.number().int().positive(),
  blocks: z.array(
    z.object({
      type: BlockType,
      text: z.string().optional(),
      imageRef: z.string().optional(),  // "image_1", "image_2" — resolved later
      level: z.number().int().min(1).max(4).optional(),
      align: z.enum(['left', 'center', 'right']).optional(),
      emphasis: z.boolean().optional(),
    })
  ),
  chapterStart: z.object({
    title: z.string(),
    level: z.number().int().min(1).max(4),
  }).optional(),
});

module.exports = {
  BookContent,
  Block,
  Chapter,
  PageExtraction,
  BlockType,
};
