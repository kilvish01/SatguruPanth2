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

        // Get PDF from S3
        let s3Key = result.Item.s3Key;
        if (s3Key.startsWith('s3://')) {
            s3Key = s3Key.replace(/^s3:\/\/[^\/]+\//, '');
        }

        const pdfData = await s3.getObject({
            Bucket: result.Item.s3Bucket,
            Key: s3Key
        }).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline'
            },
            body: pdfData.Body.toString('base64'),
            isBase64Encoded: true
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
