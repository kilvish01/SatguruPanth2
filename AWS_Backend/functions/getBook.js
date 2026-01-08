const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMO_TABLE;

exports.handler = async (event) => {
    try {
        const bookId = event.pathParameters.bookId;

        // Get book metadata
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { BookID: bookId }
        }).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Book not found' })
            };
        }

        // Increment view count
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: bookId },
            UpdateExpression: 'ADD viewCount :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();

        // Generate signed URL
        // Handle s3Key that might be in format "s3://bucket/key" or just "key"
        let s3Key = result.Item.s3Key;
        if (s3Key.startsWith('s3://')) {
            s3Key = s3Key.replace(/^s3:\/\/[^\/]+\//, '');
        }
        
        const pdfUrl = s3.getSignedUrl('getObject', {
            Bucket: result.Item.s3Bucket,
            Key: s3Key,
            Expires: 3600
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...result.Item,
                pdfUrl
            })
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