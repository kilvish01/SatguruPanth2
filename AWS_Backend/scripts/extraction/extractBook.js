#!/usr/bin/env node
//
// extractBook.js — extract ONE book end-to-end:
//
//   PDF → rasterize → Claude vision per page → merged content.json → S3
//
// What it does:
//   1. Downloads the PDF from S3 (or reads from disk if --pdf <path>).
//   2. Rasterizes each page to PNG at 2x scale.
//   3. Calls Claude Sonnet vision per page in parallel (capped concurrency).
//   4. Caches per-page results to disk so partial failures can resume cheaply
//      without re-billing already-extracted pages.
//   5. Merges all page extractions into one canonical content.json.
//   6. Uploads content.json + extracted images to the phase2dev S3 bucket.
//   7. Writes a row in the BookContent-phase2dev DynamoDB table.
//
// Usage:
//   node scripts/extraction/extractBook.js --book-id <bookId>
//   node scripts/extraction/extractBook.js --pdf ./local.pdf --book-id <id>
//   node scripts/extraction/extractBook.js --book-id <id> --dry-run
//   node scripts/extraction/extractBook.js --book-id <id> --no-upload
//   node scripts/extraction/extractBook.js --book-id <id> --limit-pages 5
//
// Env:
//   ANTHROPIC_API_KEY      required
//   STAGE                  default phase2dev
//   AWS_REGION             default us-east-1
//   EXTRACTION_MODEL       default claude-sonnet-4-6
//   EXTRACTION_CONCURRENCY default 4

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const AWS = require('aws-sdk');

const { rasterizePdf } = require('./pdfToImages');
const { extractPage, MODEL, PROMPT_VERSION } = require('./aiVision');
const { BookContent } = require('./contentSchema');

const STAGE = process.env.STAGE || 'phase2dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const CONCURRENCY = parseInt(process.env.EXTRACTION_CONCURRENCY || '4', 10);

const BOOKS_BUCKET = STAGE === 'phase2dev'
  ? 'book-reader-pdfs-phase2dev'
  : 'book-reader-pdfs';
const CONTENT_BUCKET = STAGE === 'phase2dev'
  ? 'book-reader-content-phase2dev'
  : 'book-reader-content';
const BOOKS_TABLE = STAGE === 'phase2dev'
  ? 'BooksMetadata-phase2dev'
  : 'BooksMetadata';
const CONTENT_TABLE = STAGE === 'phase2dev'
  ? 'BookContent-phase2dev'
  : 'BookContent';

const s3 = new AWS.S3({ region: REGION });
const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

// ---- CLI ----
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-upload') args.noUpload = true;
    else if (a === '--force') args.force = true;
    else if (a.startsWith('--')) {
      args[a.slice(2)] = argv[++i];
    }
  }
  return args;
}

// ---- Cache ----
function cacheDir(bookId) {
  return path.join(os.homedir(), '.satgurupanth-extract', bookId);
}
function pageCachePath(bookId, n) {
  return path.join(cacheDir(bookId), `page-${String(n).padStart(4, '0')}.json`);
}

// ---- Concurrency pool ----
async function runWithConcurrency(items, fn, limit) {
  const results = new Array(items.length);
  let cursor = 0;
  let inFlight = 0;
  return new Promise((resolve, reject) => {
    const launchNext = () => {
      if (cursor >= items.length && inFlight === 0) return resolve(results);
      while (inFlight < limit && cursor < items.length) {
        const i = cursor++;
        inFlight++;
        fn(items[i], i)
          .then((r) => { results[i] = r; })
          .catch(reject)
          .finally(() => { inFlight--; launchNext(); });
      }
    };
    launchNext();
  });
}

// ---- Cost tracking ----
// Claude Sonnet 4.6 pricing (as of 2026-05): $3 / 1M input tokens,
// $15 / 1M output tokens. Update if pricing changes.
const PRICE_INPUT_PER_1K = 0.003;
const PRICE_OUTPUT_PER_1K = 0.015;

function costFor(usage) {
  return (
    ((usage.input_tokens || 0) / 1000) * PRICE_INPUT_PER_1K +
    ((usage.output_tokens || 0) / 1000) * PRICE_OUTPUT_PER_1K
  );
}

// ---- Book fetch ----
async function fetchBookMetadata(bookId) {
  const res = await ddb.get({ TableName: BOOKS_TABLE, Key: { BookID: bookId } }).promise();
  if (!res.Item) throw new Error(`Book ${bookId} not found in ${BOOKS_TABLE}`);
  return res.Item;
}

async function downloadPdfToTmp(meta) {
  const key = meta.s3Key;
  if (!key) throw new Error(`Book ${meta.BookID} has no s3Key`);
  const tmp = path.join(os.tmpdir(), `extract-${meta.BookID}.pdf`);
  const data = await s3.getObject({ Bucket: BOOKS_BUCKET, Key: key }).promise();
  fs.writeFileSync(tmp, data.Body);
  return tmp;
}

// ---- Page extraction with caching ----
async function extractPageCached(bookId, pageNumber, pngBuffer, bookTitle, force) {
  const cachePath = pageCachePath(bookId, pageNumber);
  if (!force && fs.existsSync(cachePath)) {
    return { page: JSON.parse(fs.readFileSync(cachePath, 'utf8')), usage: { input_tokens: 0, output_tokens: 0 }, cached: true };
  }
  const result = await extractPage({ pageNumber, pngBuffer, bookTitle });
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(result.page, null, 2));
  return { ...result, cached: false };
}

// ---- Merge per-page results into canonical content.json ----
function mergePages(meta, pageResults) {
  const blocks = [];
  const chapters = [];
  let offset = 0;
  let currentChapter = null;
  let chapterCounter = 0;

  for (const result of pageResults) {
    if (!result || !result.page) continue;
    const { page } = result;

    if (page.chapterStart) {
      if (currentChapter) {
        currentChapter.endOffset = offset;
        chapters.push(currentChapter);
      }
      chapterCounter += 1;
      currentChapter = {
        id: `ch-${chapterCounter}`,
        title: page.chapterStart.title,
        startOffset: offset,
        endOffset: offset, // filled when next chapter starts or at end
        sourceStartPage: page.pageNumber,
      };
    }

    for (const block of page.blocks) {
      if (block.type === 'footer') continue; // filtered out of reader

      const charLen = block.text ? block.text.length : 0;
      blocks.push({
        type: block.type,
        offset,
        text: block.text,
        imageKey: block.imageRef
          ? `books/${meta.BookID}/images/p${page.pageNumber}-${block.imageRef}.png`
          : undefined,
        level: block.level,
        align: block.align,
        emphasis: block.emphasis,
        sourcePage: page.pageNumber,
      });
      offset += charLen;
    }
  }

  if (currentChapter) {
    currentChapter.endOffset = offset;
    chapters.push(currentChapter);
  }

  // Average Hindi reading speed: ~200 chars/min for spiritual texts (verses are slower)
  const estimatedReadingMinutes = Math.max(1, Math.round(offset / 200));

  return {
    schemaVersion: '1.0',
    bookId: meta.BookID,
    title: meta.title || 'Untitled',
    language: 'hi',
    totalBlocks: blocks.length,
    totalChars: offset,
    totalSourcePages: pageResults.length,
    estimatedReadingMinutes,
    extraction: {
      method: 'claude-vision',
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      extractedAt: new Date().toISOString(),
      pagesExtracted: pageResults.filter((r) => r && r.page).length,
      pagesFailed: pageResults.filter((r) => !r || !r.page).length,
      qaStatus: 'pending',
    },
    chapters,
    blocks,
  };
}

// ---- Main ----
async function main() {
  const args = parseArgs(process.argv);
  if (!args['book-id']) {
    console.error('Usage: extractBook.js --book-id <bookId> [--pdf <path>] [--dry-run] [--no-upload] [--force] [--limit-pages N]');
    process.exit(2);
  }

  const bookId = args['book-id'];
  console.log(`[extract] bookId=${bookId} stage=${STAGE} model=${MODEL}`);

  const meta = await fetchBookMetadata(bookId);
  console.log(`[extract] Title: ${meta.title}`);

  const pdfPath = args.pdf ? path.resolve(args.pdf) : await downloadPdfToTmp(meta);
  console.log(`[extract] PDF at: ${pdfPath}`);

  console.log(`[extract] Rasterizing…`);
  const { totalPages, pages } = await rasterizePdf(pdfPath, {
    onProgress: (i, n) => process.stdout.write(`\r  page ${i}/${n}`),
  });
  process.stdout.write('\n');
  console.log(`[extract] ${totalPages} pages rendered.`);

  const limit = args['limit-pages'] ? parseInt(args['limit-pages'], 10) : pages.length;
  const pagesToExtract = pages.slice(0, limit);

  if (args.dryRun) {
    console.log(`[extract] DRY-RUN: would call vision API on ${pagesToExtract.length} pages, est. cost ~$${(pagesToExtract.length * 0.0035).toFixed(2)}`);
    return;
  }

  console.log(`[extract] Calling vision API on ${pagesToExtract.length} pages (concurrency=${CONCURRENCY})…`);
  let done = 0;
  let totalCost = 0;
  let cachedCount = 0;
  const pageResults = await runWithConcurrency(
    pagesToExtract,
    async (p) => {
      try {
        const r = await extractPageCached(bookId, p.pageNumber, p.buffer, meta.title, args.force);
        done += 1;
        if (r.cached) cachedCount += 1;
        else totalCost += costFor(r.usage);
        process.stdout.write(`\r  extracted ${done}/${pagesToExtract.length} (cached: ${cachedCount}, cost so far: $${totalCost.toFixed(3)})`);
        return r;
      } catch (e) {
        console.error(`\n  page ${p.pageNumber} FAILED: ${e.message}`);
        return null;
      }
    },
    CONCURRENCY
  );
  process.stdout.write('\n');

  console.log(`[extract] Merging…`);
  const content = mergePages(meta, pageResults);

  const validated = BookContent.safeParse(content);
  if (!validated.success) {
    console.error('[extract] Final schema validation failed:', validated.error.errors.slice(0, 5));
    process.exit(3);
  }

  // Write content.json locally for inspection. Ensure the cache dir exists
  // even if every page extraction failed (so we still emit a debuggable file
  // showing the failure rather than crashing with ENOENT).
  fs.mkdirSync(cacheDir(bookId), { recursive: true });
  const localOut = path.join(cacheDir(bookId), 'content.json');
  fs.writeFileSync(localOut, JSON.stringify(content, null, 2));
  console.log(`[extract] Wrote ${localOut}`);
  console.log(`[extract] Stats: ${content.totalBlocks} blocks, ${content.totalChars} chars, ${content.chapters.length} chapters, ${content.extraction.pagesFailed} pages failed`);
  console.log(`[extract] AI cost this run: $${totalCost.toFixed(3)}`);

  if (args.noUpload) {
    console.log('[extract] --no-upload set, skipping S3/DynamoDB writes.');
    return;
  }

  console.log(`[extract] Uploading content.json to s3://${CONTENT_BUCKET}/books/${bookId}/content.json …`);
  await s3.putObject({
    Bucket: CONTENT_BUCKET,
    Key: `books/${bookId}/content.json`,
    Body: JSON.stringify(content),
    ContentType: 'application/json',
  }).promise();

  console.log(`[extract] Recording in ${CONTENT_TABLE} …`);
  await ddb.put({
    TableName: CONTENT_TABLE,
    Item: {
      bookId,
      contentUrl: `s3://${CONTENT_BUCKET}/books/${bookId}/content.json`,
      version: 1,
      extractionMethod: 'claude-vision',
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      qaStatus: 'pending',
      totalChars: content.totalChars,
      totalBlocks: content.totalBlocks,
      chapters: content.chapters.length,
      extractedAt: content.extraction.extractedAt,
      pagesExtracted: content.extraction.pagesExtracted,
      pagesFailed: content.extraction.pagesFailed,
    },
  }).promise();

  console.log('[extract] Done.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[extract] FATAL:', err);
    process.exit(1);
  });
}

module.exports = { main };
