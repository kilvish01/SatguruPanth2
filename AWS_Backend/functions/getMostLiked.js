const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMO_TABLE;
const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';

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

        // Generate signed URLs for book icons
        const booksWithIcons = await Promise.all(sortedBooks.map(async (book) => {
            if (book.coverImage && book.coverImage.includes('book-icons/')) {
                const iconKey = book.coverImage.split('.com/')[1] || book.coverImage.split('amazonaws.com/')[1];
                if (iconKey) {
                    try {
                        const signedUrl = s3.getSignedUrl('getObject', {
                            Bucket: S3_BUCKET,
                            Key: iconKey,
                            Expires: 604800
                        });
                        book.coverImage = signedUrl;
                    } catch (err) {
                        console.error('Error generating signed URL for icon:', err);
                    }
                }
            }
            return book;
        }));

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(booksWithIcons)
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