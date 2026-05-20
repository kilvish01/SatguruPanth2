#!/usr/bin/env node
//
// createTextOnlyBook.js — register a text-only book (no PDF) in
// BooksMetadata-phase2dev so importManualText.js has a BookID + title to
// resolve. Mirrors the schema produced by the per-book PDF uploaders
// (uploadRamayanSaar.js etc.) minus filename/s3Key/fileSize/contentType,
// since the Phase 2 reader is reflowable from BookContent and doesn't need
// a PDF artifact.
//
// Usage:
//   node scripts/extraction/createTextOnlyBook.js \
//       --book-id <UUID> \
//       --title "<Hindi title>" \
//       [--author "<Hindi author>"]   # defaults to Sureshadayal Maharaj
//       [--apply]                     # without --apply, prints the would-be Item
//
// Refuses to overwrite an existing row (uses attribute_not_exists on BookID).

require('dotenv').config();
const AWS = require('aws-sdk');

const STAGE = process.env.STAGE || 'phase2dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE = STAGE === 'phase2dev' ? 'BooksMetadata-phase2dev' : 'BooksMetadata';
const DEFAULT_AUTHOR = 'परम संत सद्‌गुरु वक्त सुरेशादयाल जी महाराज';

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args['book-id'] || !args.title) {
    console.error('Usage: createTextOnlyBook.js --book-id <UUID> --title "<title>" [--author "<author>"] [--apply]');
    process.exit(2);
  }

  const item = {
    BookID: args['book-id'],
    entityType: 'BOOK',
    title: args.title,
    author: args.author || DEFAULT_AUTHOR,
    uploadDate: new Date().toISOString(),
    viewCount: 0,
    likeCount: 0,
  };

  console.log(`[create] table=${TABLE}`);
  console.log(`[create] item:`, JSON.stringify(item, null, 2));

  if (!args.apply) {
    console.log('[create] dry-run (pass --apply to write).');
    return;
  }

  await ddb.put({
    TableName: TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(BookID)',
  }).promise();
  console.log(`[create] inserted BookID=${item.BookID}`);
}

main().catch((err) => {
  if (err.code === 'ConditionalCheckFailedException') {
    console.error('[create] BookID already exists in', TABLE, '- aborting.');
    process.exit(3);
  }
  console.error('[create] FATAL:', err);
  process.exit(1);
});
