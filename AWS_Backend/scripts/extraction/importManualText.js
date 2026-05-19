#!/usr/bin/env node
//
// importManualText.js — turn a hand-typed Hindi book (one .txt file) into a
// canonical content.json and upload it.
//
// Why this exists:
//   PDF extraction (AI vision / Tesseract OCR / pdf.js) all introduced text
//   errors for these Devanagari spiritual texts. The author/maintainer has
//   the clean Hindi text already, so we let them paste it in directly — same
//   shape as AI-extracted content, but error-free.
//
// What it does:
//   1. Reads a UTF-8 .txt file you point it at.
//   2. Splits into blocks on blank-line boundaries.
//   3. Classifies each block as heading / verse / list_item / paragraph /
//      footer using deterministic rules tuned for these books:
//        - First non-empty line of the file => title (heading level 1)
//        - Single line ending with ":-"      => section heading (level 2)
//        - Single line wrapped in straight quotes "..."  => section heading
//        - Multi-line where >=70% of lines end with "।" or "।।" => verse
//        - Block whose lines start with (I)/(i)/1. etc.       => list items
//        - Lines starting with "—" near end-of-file           => footer
//   4. Tracks character offset across blocks for stable progress markers.
//   5. Auto-derives chapters from level-2 headings.
//   6. Validates against contentSchema.js, writes content.json locally,
//      and on --apply uploads to S3 + records in DynamoDB with
//      qaStatus="ready" (manual = trusted).
//
// Usage:
//   node scripts/extraction/importManualText.js \
//       --book-id <BookID> \
//       --text-file scripts/extraction/manual-text/<slug>.txt
//
//   Add --apply to actually upload (otherwise dry-run / local-preview).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const AWS = require('aws-sdk');

const { BookContent } = require('./contentSchema');

const STAGE = process.env.STAGE || 'phase2dev';
const REGION = process.env.AWS_REGION || 'us-east-1';

const BOOKS_TABLE = STAGE === 'phase2dev' ? 'BooksMetadata-phase2dev' : 'BooksMetadata';
const CONTENT_TABLE = STAGE === 'phase2dev' ? 'BookContent-phase2dev' : 'BookContent';
const CONTENT_BUCKET = STAGE === 'phase2dev' ? 'book-reader-content-phase2dev' : 'book-reader-content';

const s3 = new AWS.S3({ region: REGION });
const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--no-upload') args.noUpload = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// Parsing helpers — tuned for the Suresha Dayal / spiritual book corpus.
// ---------------------------------------------------------------------------

const DEVANAGARI_DANDA = /[।!?]{1,2}\s*$/;       // ।  ।।  !  !!  ?  ??  at line end
const QUOTED_HEADING = /^["“][^"”]+["”]$/;       // entire line is quoted
const HEADING_SUFFIX = /:-{1,}\s*$/;             // ends with " :-" or ":---"
const HEADING_DASHES = /\s-{2,}\s*$/;            // ends with " ---" or " ----"
const DASH_HEADING = /^-\s*(.+?)\s*-\s*$/;       // "- TITLE -"
const STAR_HEADING = /^\*\s*(.+?)\s*\*\s*$/;     // "* TITLE *"
const BULLET_HEADING = /^[•·■▪◆◾○●]\s*(.+)$/;     // bullet/interpunct/square prefix
const TRAILING_DASH = /\s+-+\s*$/;               // strips " -" / " --" / " ---"
const SANSKRIT_BOUNDARY = /^॥.*॥$/;              // "॥ इति ज्ञान-गंगा ॥"
const SEPARATOR_LINE = /^[\s━─=~_-]+$/;          // decorative rule lines (no *: stars are headings)
const ROMAN_LIST = /^\(\s*[IVXLM]+\s*\)\s+/i;    // (I), ( II ), (iii)
const NUM_DOT_LIST = /^\d+\.\s+/;                // 1. 2.
const ALPHA_LIST   = /^\([a-z]\)\s+/i;            // (a) (b)
const EN_DASH      = '—';                        // em-dash author signature

function preprocess(text) {
  // Normalize newlines and strip decorative separator-only lines so they
  // collapse adjacent blocks into one boundary instead of producing empty
  // blocks.
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => (SEPARATOR_LINE.test(l) ? '' : l))
    .join('\n');
}

function splitBlocks(text) {
  return preprocess(text)
    .split(/\n\s*\n+/)
    .map((b) => b.replace(/\s+$/, ''))
    .filter((b) => b.trim().length > 0);
}

function isVerse(lines) {
  // Verse heuristic tuned for the actual books in this library:
  //   - Stanzas are typically 2 or 4 lines.
  //   - The closing line of every stanza ends with "।" or "।।" (or "!"/"!!").
  //   - In 4-line stanzas, lines 1 and 3 commonly end with a comma, lines 2
  //     and 4 with a danda — so only ~50% of lines hit the danda regex.
  //   - In 2-line couplets, both lines usually end with the danda.
  //
  // So: require >= 2 lines, the LAST line must end with danda, AND at least
  // one line ends with comma OR >= 50% of lines end with danda. This separates
  // verses cleanly from prose paragraphs (which rarely have comma-ending
  // lines as continuation).
  if (lines.length < 2) return false;
  const trimmed = lines.map((l) => l.trim());
  const lastEndsWithDanda = DEVANAGARI_DANDA.test(trimmed[trimmed.length - 1]);
  if (!lastEndsWithDanda) return false;
  const commaLines = trimmed.filter((l) => /,\s*$/.test(l)).length;
  const dandaLines = trimmed.filter((l) => DEVANAGARI_DANDA.test(l)).length;
  return commaLines >= 1 || dandaLines / trimmed.length >= 0.5;
}

function isListBlock(lines) {
  // Every (non-empty) line must start with one of the recognized list markers.
  if (!lines.length) return false;
  return lines.every((l) => {
    const t = l.trim();
    return ROMAN_LIST.test(t) || NUM_DOT_LIST.test(t) || ALPHA_LIST.test(t);
  });
}

function stripListMarker(line) {
  return line.trim()
    .replace(ROMAN_LIST, '')
    .replace(NUM_DOT_LIST, '')
    .replace(ALPHA_LIST, '')
    .trim();
}

function classifyBlock(rawBlock, isFirstBlock) {
  const lines = rawBlock.split('\n').map((l) => l).filter((l) => l.trim().length > 0);
  const joined = lines.join(' ').trim();

  // First non-empty block of the file is the title.
  if (isFirstBlock) {
    return [{ type: 'heading', level: 1, text: joined }];
  }

  // Try to parse the first line as a heading; emit + recurse on remainder.
  const headingMatch = detectHeading(lines[0]);
  if (headingMatch && lines.length === 1) {
    return [headingMatch];
  }
  if (headingMatch && lines.length > 1) {
    const rest = lines.slice(1).join('\n');
    return [headingMatch, ...classifyBlock(rest, false)];
  }

  // Standalone short non-verse line is almost always a section title.
  if (lines.length === 1) {
    const t = lines[0].trim();
    if (
      t.length < 80 &&
      !DEVANAGARI_DANDA.test(t) &&
      !ROMAN_LIST.test(t) &&
      !NUM_DOT_LIST.test(t) &&
      !t.includes(':') &&
      !t.startsWith(EN_DASH) &&
      !t.startsWith('(')
    ) {
      return [{ type: 'heading', level: 2, text: t }];
    }
  }

  // Author signature / footer (em-dash at start of line, or short
  // contact-info lines at end of file).
  if (lines.every((l) => {
    const t = l.trim();
    return t.startsWith(EN_DASH) ||
      /सम्पर्क सूत्र/.test(t) ||
      /सीतापुर/.test(t) ||
      /^[\(\)\d\s—-]+$/.test(t) ||
      /^(लेखक|ब्रह्मज्ञान|उ०\s*प्र०|मोचकला|बिसवाँ)/.test(t);
  })) {
    return [{ type: 'footer', text: joined }];
  }

  // CRITICAL: list check MUST come before verse check, since list items
  // also end with danda "।". A block where EVERY non-empty line starts with
  // a list marker is a list, not a verse.
  if (isListBlock(lines)) {
    return lines.map((l) => ({
      type: 'list_item',
      text: stripListMarker(l),
    }));
  }

  // Verse.
  if (isVerse(lines)) {
    return [{ type: 'verse', text: lines.map((l) => l.trim()).join('\n') }];
  }

  // Default: each line is a paragraph.
  return lines.map((l) => ({ type: 'paragraph', text: l.trim() }));
}

// Returns a heading block descriptor if `line` looks like a heading, else null.
function detectHeading(line) {
  const t = line.trim();
  if (!t) return null;

  // "* TITLE *" — Satya Gyan Ko Jane style
  const star = t.match(STAR_HEADING);
  if (star) return { type: 'heading', level: 2, text: star[1].trim() };

  // "- TITLE -" — Gyan Ganga style
  const dash = t.match(DASH_HEADING);
  if (dash) return { type: 'heading', level: 2, text: dash[1].trim() };

  // "॥ इति ... ॥" — Sanskrit closing boundary
  if (SANSKRIT_BOUNDARY.test(t)) {
    return { type: 'heading', level: 2, text: t };
  }

  // ends with ":-" or ":---" — Suresha Dayal universal section-header style
  if (HEADING_SUFFIX.test(t)) {
    return {
      type: 'heading',
      level: 2,
      text: t.replace(HEADING_SUFFIX, '').replace(BULLET_HEADING, '$1').trim(),
    };
  }

  // bullet/interpunct/square prefix + trailing dashes — e.g.
  //   "• जीव की आवश्यकताएँ :---"
  //   "· भक्ति परमात्मा की धार की करे:---"
  //   "■ सद्गुरु की चेतावनी -"
  const bullet = t.match(BULLET_HEADING);
  if (bullet) {
    let body = bullet[1].trim();
    body = body
      .replace(HEADING_DASHES, '')
      .replace(HEADING_SUFFIX, '')
      .replace(TRAILING_DASH, '')
      .trim();
    if (body.length > 0) {
      return { type: 'heading', level: 2, text: body };
    }
  }

  // line is entirely wrapped in straight or curly quotes
  if (QUOTED_HEADING.test(t)) {
    return { type: 'heading', level: 2, text: t.replace(/^["“]|["”]$/g, '').trim() };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Build canonical BookContent
// ---------------------------------------------------------------------------

function buildContent({ bookId, title, sourceText }) {
  const blocks = [];
  const chapters = [];
  let offset = 0;
  let currentChapter = null;
  let chapterCounter = 0;
  let sourcePage = 1; // we do not know real page numbers from manual text

  const rawBlocks = splitBlocks(sourceText);

  rawBlocks.forEach((rawBlock, idx) => {
    const classified = classifyBlock(rawBlock, idx === 0);
    classified.forEach((b) => {
      // Treat the first level-1 OR every level-2 heading as a chapter start.
      if (b.type === 'heading' && (b.level === 1 || (b.level === 2 && idx !== 0))) {
        if (currentChapter) {
          currentChapter.endOffset = offset;
          chapters.push(currentChapter);
        }
        chapterCounter += 1;
        currentChapter = {
          id: `ch-${chapterCounter}`,
          title: b.text,
          startOffset: offset,
          endOffset: offset,
          sourceStartPage: sourcePage,
        };
      }

      const block = {
        type: b.type,
        offset,
        text: b.text,
        level: b.level,
        sourcePage,
      };
      blocks.push(block);
      offset += (b.text || '').length;
    });
    // Bump page counter every ~6 blocks so we have *some* page provenance.
    if ((idx + 1) % 6 === 0) sourcePage += 1;
  });

  if (currentChapter) {
    currentChapter.endOffset = offset;
    chapters.push(currentChapter);
  }

  return {
    schemaVersion: '1.0',
    bookId,
    title,
    language: 'hi',
    totalBlocks: blocks.length,
    totalChars: offset,
    totalSourcePages: sourcePage,
    estimatedReadingMinutes: Math.max(1, Math.round(offset / 200)),
    extraction: {
      method: 'claude-vision', // schema constraint; semantically "manual"
      model: 'manual-import',
      promptVersion: 'manual-2026-05-15',
      extractedAt: new Date().toISOString(),
      pagesExtracted: sourcePage,
      pagesFailed: 0,
      qaStatus: 'ready',
    },
    chapters,
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function fetchBookMetadata(bookId) {
  const res = await ddb.get({ TableName: BOOKS_TABLE, Key: { BookID: bookId } }).promise();
  if (!res.Item) throw new Error(`Book ${bookId} not found in ${BOOKS_TABLE}`);
  return res.Item;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args['book-id'] || !args['text-file']) {
    console.error(
      'Usage: importManualText.js --book-id <BookID> --text-file <path.txt> [--apply] [--no-upload]'
    );
    process.exit(2);
  }

  const bookId = args['book-id'];
  const textPath = path.resolve(args['text-file']);
  if (!fs.existsSync(textPath)) {
    console.error(`Text file not found: ${textPath}`);
    process.exit(3);
  }
  const sourceText = fs.readFileSync(textPath, 'utf8');

  console.log(`[import] bookId=${bookId} stage=${STAGE}`);
  console.log(`[import] source: ${textPath} (${sourceText.length} chars)`);

  const meta = await fetchBookMetadata(bookId);
  console.log(`[import] Title from DynamoDB: ${meta.title}`);

  const content = buildContent({
    bookId,
    title: meta.title,
    sourceText,
  });

  const validated = BookContent.safeParse(content);
  if (!validated.success) {
    console.error('[import] schema validation failed:');
    console.error(JSON.stringify(validated.error.errors.slice(0, 5), null, 2));
    process.exit(4);
  }

  // Print summary
  console.log(`[import] Stats:`);
  console.log(`  totalBlocks: ${content.totalBlocks}`);
  console.log(`  totalChars:  ${content.totalChars}`);
  console.log(`  chapters:    ${content.chapters.length}`);
  console.log(`  est read:    ${content.estimatedReadingMinutes} min`);

  const counts = content.blocks.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});
  console.log(`  blocks by type:`, counts);

  if (content.chapters.length) {
    console.log(`  first 5 chapters:`);
    content.chapters.slice(0, 5).forEach((c) =>
      console.log(`    - ${c.title.slice(0, 70)}${c.title.length > 70 ? '…' : ''}`)
    );
  }

  // Always write a local copy so the user can spot-check.
  const localOut = path.join(os.homedir(), '.satgurupanth-extract', bookId, 'content.json');
  fs.mkdirSync(path.dirname(localOut), { recursive: true });
  fs.writeFileSync(localOut, JSON.stringify(content, null, 2));
  console.log(`[import] Wrote local copy: ${localOut}`);

  if (args.noUpload || !args.apply) {
    console.log(`[import] Skipping upload (pass --apply to upload to ${CONTENT_BUCKET} + ${CONTENT_TABLE}).`);
    return;
  }

  // S3 upload
  const s3Key = `books/${bookId}/content.json`;
  console.log(`[import] Uploading -> s3://${CONTENT_BUCKET}/${s3Key}`);
  await s3.putObject({
    Bucket: CONTENT_BUCKET,
    Key: s3Key,
    Body: JSON.stringify(content),
    ContentType: 'application/json; charset=utf-8',
  }).promise();

  // DynamoDB record
  console.log(`[import] Recording in ${CONTENT_TABLE}`);
  await ddb.put({
    TableName: CONTENT_TABLE,
    Item: {
      bookId,
      contentUrl: `s3://${CONTENT_BUCKET}/${s3Key}`,
      version: 1,
      extractionMethod: 'manual',
      model: 'manual-import',
      promptVersion: 'manual-2026-05-15',
      qaStatus: 'ready',
      totalChars: content.totalChars,
      totalBlocks: content.totalBlocks,
      chapters: content.chapters.length,
      extractedAt: content.extraction.extractedAt,
      pagesExtracted: content.extraction.pagesExtracted,
      pagesFailed: 0,
    },
  }).promise();

  console.log(`[import] Done.`);
}

main().catch((err) => {
  console.error('[import] FATAL:', err);
  process.exit(1);
});
