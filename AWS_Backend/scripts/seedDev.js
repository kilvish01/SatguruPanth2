#!/usr/bin/env node
//
// seedDev.js — one-time copy of production data into the phase2dev environment.
//
// What it does:
//   1. Scans the prod BooksMetadata DynamoDB table and writes every item into
//      the phase2dev mirror table (BooksMetadata-phase2dev).
//   2. Copies every object from the prod S3 bucket (book-reader-pdfs) into the
//      phase2dev bucket (book-reader-pdfs-phase2dev), preserving keys.
//
// What it does NOT do:
//   - Touch the prod table or prod bucket in any way (read-only on prod).
//   - Copy user reading-progress records — phase2dev starts with a clean
//     ReadingProgress table on purpose so dev testing is isolated.
//
// Prereqs:
//   - AWS credentials with read access to prod resources + write access to
//     phase2dev resources (your existing IAM user is sufficient).
//   - The phase2dev tables and buckets must exist already, i.e. you have run
//       cd AWS_Backend && serverless deploy --stage phase2dev
//     first. CloudFormation creates them as part of that deploy.
//
// Usage:
//   cd AWS_Backend
//   node scripts/seedDev.js              # dry-run, prints what it would copy
//   node scripts/seedDev.js --apply      # actually performs the copy
//   node scripts/seedDev.js --apply --tables-only   # skip S3 copy (faster)
//   node scripts/seedDev.js --apply --s3-only       # skip Dynamo copy

const AWS = require('aws-sdk');

const REGION = 'us-east-1';
const SRC_TABLE = 'BooksMetadata';
const DST_TABLE = 'BooksMetadata-phase2dev';
const SRC_BUCKET = 'book-reader-pdfs';
const DST_BUCKET = 'book-reader-pdfs-phase2dev';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const TABLES_ONLY = args.includes('--tables-only');
const S3_ONLY = args.includes('--s3-only');

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });
const s3 = new AWS.S3({ region: REGION });

function log(...a) {
  console.log(`[seedDev]`, ...a);
}

async function copyDynamoTable() {
  log(`Scanning ${SRC_TABLE} …`);
  const items = [];
  let lastKey;
  do {
    const page = await ddb
      .scan({ TableName: SRC_TABLE, ExclusiveStartKey: lastKey })
      .promise();
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);
  log(`Found ${items.length} items in ${SRC_TABLE}.`);

  if (!APPLY) {
    log(`Dry-run: would write ${items.length} items to ${DST_TABLE}. Pass --apply to proceed.`);
    return;
  }

  // BatchWrite in chunks of 25 (DynamoDB limit).
  let written = 0;
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    const requestItems = {
      [DST_TABLE]: chunk.map((Item) => ({ PutRequest: { Item } })),
    };
    let attempt = 0;
    let remaining = requestItems;
    while (remaining[DST_TABLE]?.length) {
      const res = await ddb.batchWrite({ RequestItems: remaining }).promise();
      const unprocessed = res.UnprocessedItems?.[DST_TABLE] || [];
      written += chunk.length - unprocessed.length;
      if (!unprocessed.length) break;
      attempt += 1;
      if (attempt > 5) {
        throw new Error(`Gave up after 5 retries; ${unprocessed.length} items still unprocessed.`);
      }
      remaining = { [DST_TABLE]: unprocessed };
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
    process.stdout.write(`\r  wrote ${written}/${items.length}…`);
  }
  process.stdout.write('\n');
  log(`Dynamo copy complete: ${written}/${items.length} written to ${DST_TABLE}.`);
}

async function copyS3Bucket() {
  log(`Listing objects in s3://${SRC_BUCKET} …`);
  const keys = [];
  let continuationToken;
  do {
    const page = await s3
      .listObjectsV2({ Bucket: SRC_BUCKET, ContinuationToken: continuationToken })
      .promise();
    (page.Contents || []).forEach((o) => keys.push(o.Key));
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  log(`Found ${keys.length} objects in ${SRC_BUCKET}.`);

  if (!APPLY) {
    log(
      `Dry-run: would copy ${keys.length} objects into s3://${DST_BUCKET}. Pass --apply to proceed.`
    );
    return;
  }

  let copied = 0;
  const CONCURRENCY = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < keys.length) {
      const i = cursor++;
      const key = keys[i];
      try {
        await s3
          .copyObject({
            Bucket: DST_BUCKET,
            Key: key,
            CopySource: encodeURIComponent(`${SRC_BUCKET}/${key}`),
          })
          .promise();
        copied += 1;
      } catch (err) {
        console.error(`\n  failed to copy ${key}: ${err.message}`);
      }
      if (copied % 10 === 0) {
        process.stdout.write(`\r  copied ${copied}/${keys.length}…`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write('\n');
  log(`S3 copy complete: ${copied}/${keys.length} objects copied to ${DST_BUCKET}.`);
}

(async () => {
  log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)'}`);
  if (!S3_ONLY) await copyDynamoTable();
  if (!TABLES_ONLY) await copyS3Bucket();
  log('Done.');
})().catch((err) => {
  console.error('[seedDev] FATAL:', err);
  process.exit(1);
});
