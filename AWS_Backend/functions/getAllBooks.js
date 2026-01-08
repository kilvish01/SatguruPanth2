const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result.Items)
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