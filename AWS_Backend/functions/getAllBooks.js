const AWS = require('aws-sdk');
const { tryDecodeUserId } = require('../services/jwt');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMO_TABLE;
const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';

exports.handler = async (event) => {
  try {
    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :entityType',
      ExpressionAttributeValues: { ':entityType': 'BOOK' },
    }).promise();

    const booksWithIcons = await Promise.all(result.Items.map(async (book) => {
      if (book.coverImage && book.coverImage.includes('book-icons/')) {
        const iconKey = book.coverImage.split('.com/')[1] || book.coverImage.split('amazonaws.com/')[1];
        if (iconKey) {
          try {
            book.coverImage = s3.getSignedUrl('getObject', {
              Bucket: S3_BUCKET,
              Key: iconKey,
              Expires: 604800, // 7 days
            });
          } catch (err) {
            console.error('Error generating signed URL for icon:', err);
          }
        }
      }
      return book;
    }));

    // If the caller is authenticated, annotate each book with whether *they*
    // liked it. Unauthenticated callers get books without the flag (so the
    // public list endpoint still works for not-yet-logged-in clients).
    const userId = tryDecodeUserId(event);
    if (userId) {
      const likes = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :t AND userId = :u',
        ExpressionAttributeValues: { ':t': 'LIKE', ':u': userId },
        ProjectionExpression: 'bookId',
      }).promise();
      const likedSet = new Set((likes.Items || []).map((i) => i.bookId));
      booksWithIcons.forEach((b) => {
        b.likedByMe = likedSet.has(b.BookID);
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booksWithIcons),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
