const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
    try {
        const bookId = event.pathParameters.bookId;

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
            body: JSON.stringify({ message: 'Book liked successfully' })
        };
    } catch (error) {
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