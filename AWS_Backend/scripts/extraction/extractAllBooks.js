#!/usr/bin/env node
//
// extractAllBooks.js — runs extractBook serially for every book in the
// BooksMetadata-phase2dev table. Tracks cumulative cost + reports a summary
// at the end.
//
// Why serial? Each book's per-page extraction already runs at concurrency
// internally (default 4 in-flight). Running multiple books in parallel would
// likely hit Anthropic API rate limits.
//
// Usage:
//   node scripts/extraction/extractAllBooks.js
//   node scripts/extraction/extractAllBooks.js --dry-run
//   node scripts/extraction/extractAllBooks.js --limit 3        # first 3 books
//   node scripts/extraction/extractAllBooks.js --resume         # skip books
//                                                                 already in
//                                                                 BookContent

require('dotenv').config();
const AWS = require('aws-sdk');
const { spawn } = require('child_process');
const path = require('path');

const STAGE = process.env.STAGE || 'phase2dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const BOOKS_TABLE = STAGE === 'phase2dev' ? 'BooksMetadata-phase2dev' : 'BooksMetadata';
const CONTENT_TABLE = STAGE === 'phase2dev' ? 'BookContent-phase2dev' : 'BookContent';

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--resume') args.resume = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
  }
  return args;
}

async function listBooks() {
  const items = [];
  let lastKey;
  do {
    const page = await ddb.scan({
      TableName: BOOKS_TABLE,
      FilterExpression: 'entityType = :t',
      ExpressionAttributeValues: { ':t': 'BOOK' },
      ExclusiveStartKey: lastKey,
    }).promise();
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function alreadyExtracted(bookId) {
  const res = await ddb.get({ TableName: CONTENT_TABLE, Key: { bookId } }).promise();
  return Boolean(res.Item);
}

function runChild(bookId, extraArgs) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, 'extractBook.js');
    const child = spawn(process.execPath, [script, '--book-id', bookId, ...extraArgs], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const books = await listBooks();
  console.log(`[batch] Found ${books.length} books in ${BOOKS_TABLE}.`);

  const limited = args.limit ? books.slice(0, parseInt(args.limit, 10)) : books;
  const passThrough = args.dryRun ? ['--dry-run'] : [];

  const results = [];
  for (const book of limited) {
    if (args.resume && (await alreadyExtracted(book.BookID))) {
      console.log(`[batch] Skipping ${book.BookID} (already extracted)`);
      results.push({ bookId: book.BookID, status: 'skipped' });
      continue;
    }
    console.log(`\n[batch] === Extracting ${book.BookID}: ${book.title} ===`);
    try {
      await runChild(book.BookID, passThrough);
      results.push({ bookId: book.BookID, status: 'ok' });
    } catch (e) {
      console.error(`[batch] ${book.BookID} FAILED: ${e.message}`);
      results.push({ bookId: book.BookID, status: 'failed', error: e.message });
    }
  }

  console.log('\n[batch] === Summary ===');
  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed');
  console.log(`  ok:      ${ok}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  failed:  ${failed.length}`);
  if (failed.length) {
    console.log('  Failed books:');
    failed.forEach((f) => console.log(`    - ${f.bookId}: ${f.error}`));
  }
}

main().catch((err) => {
  console.error('[batch] FATAL:', err);
  process.exit(1);
});
