const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
    try {
        const limit = parseInt(event.queryStringParameters?.limit) || 10;

        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();

        const sortedBooks = result.Items
            .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
            .slice(0, limit);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sortedBooks)
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