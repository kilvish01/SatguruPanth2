const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
    try {
        const bookId = event.pathParameters.bookId;

        // Parse body to check for action (like or unlike)
        let action = 'like';
        if (event.body) {
            const body = JSON.parse(event.body);
            action = body.action || 'like';
        }

        if (action === 'unlike') {
            // Decrement like count (but don't go below 0)
            await dynamodb.update({
                TableName: TABLE_NAME,
                Key: { BookID: bookId },
                UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) - :dec',
                ConditionExpression: 'likeCount > :zero',
                ExpressionAttributeValues: {
                    ':dec': 1,
                    ':zero': 0
                }
            }).promise();

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Book unliked successfully', action: 'unliked' })
            };
        } else {
            // Increment like count
            await dynamodb.update({
                TableName: TABLE_NAME,
                Key: { BookID: bookId },
                UpdateExpression: 'ADD likeCount :inc',
                ExpressionAttributeValues: {
                    ':inc': 1
                }
            }).promise();

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Book liked successfully', action: 'liked' })
            };
        }
    } catch (error) {
        // If condition fails (likeCount is 0), still return success
        if (error.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Book already has 0 likes', action: 'unchanged' })
            };
        }

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};