// GET /api/books/:bookId/content
//
// Returns the reflowable content.json for a book if one exists. Looks up the
// pointer row in the BookContent table, fetches the JSON from S3, and proxies
// it back to the client. A 404 means the book has no extracted content yet —
// the client should fall back to the existing pdf.js WebView reader.

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'us-east-1';
const CONTENT_TABLE = process.env.BOOK_CONTENT_TABLE;
const CONTENT_BUCKET = process.env.CONTENT_BUCKET;

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });
const s3 = new AWS.S3({ region: REGION });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

exports.handler = async (event) => {
  try {
    const bookId = event.pathParameters && event.pathParameters.bookId;
    if (!bookId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'bookId required' }) };
    }

    const meta = await ddb.get({ TableName: CONTENT_TABLE, Key: { bookId } }).promise();
    if (!meta.Item) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No reflowable content for this book' }) };
    }
    if (meta.Item.qaStatus !== 'ready') {
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: 'Content not yet ready', qaStatus: meta.Item.qaStatus }),
      };
    }

    // contentUrl format: s3://<bucket>/<key>
    let key = `books/${bookId}/content.json`;
    if (meta.Item.contentUrl && meta.Item.contentUrl.startsWith('s3://')) {
      key = meta.Item.contentUrl.replace(/^s3:\/\/[^\/]+\//, '');
    }

    const obj = await s3.getObject({ Bucket: CONTENT_BUCKET, Key: key }).promise();

    return {
      statusCode: 200,
      headers: {
        ...CORS,
        // Aggressive caching — content.json only changes when an extraction
        // is re-run, which is rare. Bump the bookId path on re-extraction
        // (we'd add a version suffix) to bust caches.
        'Cache-Control': 'public, max-age=3600',
      },
      body: obj.Body.toString('utf-8'),
    };
  } catch (err) {
    console.error('getBookContent error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
