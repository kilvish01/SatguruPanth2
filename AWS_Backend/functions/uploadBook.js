const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMO_TABLE;
const BUCKET_NAME = process.env.S3_BUCKET;

exports.handler = async (event) => {
    try {
        const { file_content, title, author, userId } = JSON.parse(event.body);

        if (!file_content || !title || !author) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const bookId = uuidv4();
        const fileKey = `books/${bookId}-${title}.pdf`;

        // Upload to S3
        const buffer = Buffer.from(file_content, 'base64');
        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: 'application/pdf'
        }).promise();

        // Save metadata to DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                BookID: bookId,
                entityType: 'BOOK',
                title: title,
                filename: `${title}.pdf`,
                s3Key: fileKey,
                s3Bucket: BUCKET_NAME,
                fileSize: buffer.length,
                contentType: 'application/pdf',
                uploadDate: new Date().toISOString(),
                viewCount: 0,
                likeCount: 0
            }
        }).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Book uploaded successfully',
                bookId,
                title
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