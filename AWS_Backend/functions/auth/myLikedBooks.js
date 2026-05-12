// GET /api/me/liked-books
// Returns the list of books the current user has liked. Backed by the
// per-user LIKE records written by likeBook.js.

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMO_TABLE;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.userId;
    if (!userId) return json(401, { error: 'Unauthenticated' });

    // Scan for LIKE rows matching this user. (Fine at our scale; would migrate
    // to a GSI keyed on userId if user count grows.)
    const likes = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :t AND userId = :u',
      ExpressionAttributeValues: { ':t': 'LIKE', ':u': userId },
    }).promise();

    const bookIds = (likes.Items || []).map((it) => it.bookId);
    if (bookIds.length === 0) return json(200, []);

    // Fetch book metadata one-by-one (small N).
    const books = await Promise.all(bookIds.map(async (bookId) => {
      try {
        const r = await dynamodb.get({ TableName: TABLE_NAME, Key: { BookID: bookId } }).promise();
        return r.Item || null;
      } catch (_) { return null; }
    }));

    return json(200, books.filter(Boolean));
  } catch (err) {
    console.error('myLikedBooks error:', err);
    return json(500, { error: 'Internal error' });
  }
};
