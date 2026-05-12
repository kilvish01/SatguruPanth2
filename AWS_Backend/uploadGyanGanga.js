const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SRC_PATH = '/Users/amishmishra/Downloads/ज्ञान - गंगा.pdf';
const FILENAME = 'Gyan_Ganga.pdf';
const TITLE = 'ज्ञान - गंगा';
const AUTHOR = 'परम संत सद्‌गुरु वक्त सुरेशादयाल जी महाराज';

async function alreadyExists(title) {
  const result = await dynamodb.scan({
    TableName: process.env.DYNAMO_TABLE,
    FilterExpression: 'entityType = :type AND title = :title',
    ExpressionAttributeValues: { ':type': 'BOOK', ':title': title }
  }).promise();
  return result.Items && result.Items.length > 0;
}

async function main() {
  console.log(`Source: ${SRC_PATH}`);
  if (!fs.existsSync(SRC_PATH)) {
    console.error('Source file not found.');
    process.exit(1);
  }

  if (await alreadyExists(TITLE)) {
    console.log(`Book "${TITLE}" already exists in DynamoDB. Aborting to avoid duplicate.`);
    process.exit(0);
  }

  const buffer = fs.readFileSync(SRC_PATH);
  console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  const s3Key = `books/${FILENAME}`;
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'application/pdf'
  }).promise();
  console.log(`Uploaded to s3://${process.env.S3_BUCKET}/${s3Key}`);

  const bookId = uuidv4();
  await dynamodb.put({
    TableName: process.env.DYNAMO_TABLE,
    Item: {
      BookID: bookId,
      entityType: 'BOOK',
      title: TITLE,
      author: AUTHOR,
      filename: FILENAME,
      s3Key,
      s3Bucket: process.env.S3_BUCKET,
      fileSize: buffer.length,
      contentType: 'application/pdf',
      uploadDate: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0
    }
  }).promise();

  console.log(`Saved metadata to DynamoDB. BookID: ${bookId}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
