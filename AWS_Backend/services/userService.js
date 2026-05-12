// User records live in the same BooksMetadata DynamoDB table as books, using
// a `USER#<googleSub>` partition key and entityType = 'USER'. Keeps us on a
// single-table setup with the IAM policies and indexes we already provision.
//
// Each user record:
//   BookID:       "USER#<googleSub>"   (sort/partition key in BooksMetadata)
//   entityType:   "USER"
//   userId:       "<googleSub>"        (mirrors the Google subject for easy lookup)
//   email:        verified Google email
//   name:         Google display name
//   picture:      Google avatar URL (optional)
//   createdAt:    ISO timestamp of first sign-in
//   lastSignInAt: ISO timestamp of most recent sign-in

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMO_TABLE;

function userKey(userId) {
  return `USER#${userId}`;
}

async function upsertUserFromGoogle(googlePayload) {
  const userId = googlePayload.sub;
  const now = new Date().toISOString();

  const existing = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { BookID: userKey(userId) },
  }).promise();

  if (existing.Item) {
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { BookID: userKey(userId) },
      UpdateExpression: 'SET email = :email, #n = :name, picture = :picture, lastSignInAt = :now',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: {
        ':email': googlePayload.email,
        ':name': googlePayload.name || '',
        ':picture': googlePayload.picture || '',
        ':now': now,
      },
    }).promise();
    return { ...existing.Item, email: googlePayload.email, name: googlePayload.name || '', picture: googlePayload.picture || '', lastSignInAt: now };
  }

  const item = {
    BookID: userKey(userId),
    entityType: 'USER',
    userId,
    email: googlePayload.email,
    name: googlePayload.name || '',
    picture: googlePayload.picture || '',
    createdAt: now,
    lastSignInAt: now,
  };
  await dynamodb.put({ TableName: TABLE_NAME, Item: item }).promise();
  return item;
}

async function getUser(userId) {
  const res = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { BookID: userKey(userId) },
  }).promise();
  return res.Item || null;
}

// Deletes the user's profile row and all per-user LIKE rows. We don't
// decrement book likeCount here — keeping aggregate counts stable when a
// single user leaves matches the "tombstone" intent of account deletion and
// avoids racing concurrent likes from other users.
async function deleteUserData(userId) {
  const likes = await dynamodb.scan({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :t AND userId = :u',
    ExpressionAttributeValues: { ':t': 'LIKE', ':u': userId },
    ProjectionExpression: 'BookID',
  }).promise();

  const deletions = (likes.Items || []).map((it) =>
    dynamodb.delete({ TableName: TABLE_NAME, Key: { BookID: it.BookID } }).promise()
  );
  await Promise.all(deletions);

  await dynamodb.delete({
    TableName: TABLE_NAME,
    Key: { BookID: userKey(userId) },
  }).promise();

  return { likesDeleted: deletions.length };
}

module.exports = { upsertUserFromGoogle, getUser, deleteUserData };
