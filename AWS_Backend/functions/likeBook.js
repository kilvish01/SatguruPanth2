// POST /api/books/{bookId}/like
// Body: { action?: 'like' | 'unlike' }
// Requires Cognito Authorizer (JWT in Authorization header).
//
// Schema: per-user idempotent like records prevent double-counting.
//   - LIKE row:   BookID = "LIKE#<userId>#<bookId>", entityType = 'LIKE',
//                 userId, bookId, likedAt
//   - BOOK row:   keeps a denormalised `likeCount` for fast list reads,
//                 conditionally incremented/decremented based on whether
//                 the LIKE row was created/deleted.

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMO_TABLE;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

function likeKey(userId, bookId) {
  return `LIKE#${userId}#${bookId}`;
}

exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.userId;
    if (!userId) return json(401, { error: 'Unauthenticated' });

    const bookId = event.pathParameters && event.pathParameters.bookId;
    if (!bookId) return json(400, { error: 'bookId is required' });

    const body = event.body ? JSON.parse(event.body) : {};
    const action = body.action === 'unlike' ? 'unlike' : 'like';
    const likeRowKey = likeKey(userId, bookId);

    if (action === 'like') {
      // Insert the LIKE row only if it didn't already exist; if it did, this
      // request is a no-op and the counter must not move.
      try {
        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            BookID: likeRowKey,
            entityType: 'LIKE',
            userId,
            bookId,
            likedAt: new Date().toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(BookID)',
        }).promise();
      } catch (err) {
        if (err.code === 'ConditionalCheckFailedException') {
          return json(200, { action: 'unchanged', liked: true });
        }
        throw err;
      }

      await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { BookID: bookId },
        UpdateExpression: 'ADD likeCount :one',
        ExpressionAttributeValues: { ':one': 1 },
      }).promise();

      return json(200, { action: 'liked', liked: true });
    }

    // unlike
    try {
      await dynamodb.delete({
        TableName: TABLE_NAME,
        Key: { BookID: likeRowKey },
        ConditionExpression: 'attribute_exists(BookID)',
      }).promise();
    } catch (err) {
      if (err.code === 'ConditionalCheckFailedException') {
        return json(200, { action: 'unchanged', liked: false });
      }
      throw err;
    }

    try {
      await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { BookID: bookId },
        UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) - :one',
        ConditionExpression: 'likeCount > :zero',
        ExpressionAttributeValues: { ':one': 1, ':zero': 0 },
      }).promise();
    } catch (err) {
      if (err.code !== 'ConditionalCheckFailedException') throw err;
      // already at 0 — ignore
    }

    return json(200, { action: 'unliked', liked: false });
  } catch (err) {
    console.error('likeBook error:', err);
    return json(500, { error: 'Internal error' });
  }
};
