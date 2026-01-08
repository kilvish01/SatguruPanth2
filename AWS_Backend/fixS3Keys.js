const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const TABLE_NAME = process.env.DYNAMO_TABLE;

async function fixS3Keys() {
    try {
        // Get all books
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();

        console.log(`Found ${result.Items.length} books`);

        // Fix each book's s3Key
        for (const book of result.Items) {
            if (book.s3Key && book.s3Key.startsWith('s3://')) {
                const fixedKey = book.s3Key.replace(/^s3:\/\/[^\/]+\//, '');
                
                await dynamodb.update({
                    TableName: TABLE_NAME,
                    Key: { BookID: book.BookID },
                    UpdateExpression: 'SET s3Key = :key',
                    ExpressionAttributeValues: {
                        ':key': fixedKey
                    }
                }).promise();

                console.log(`✅ Fixed ${book.title}: ${book.s3Key} -> ${fixedKey}`);
            } else {
                console.log(`✓ ${book.title}: s3Key is already correct`);
            }
        }

        console.log('\n✅ All s3Keys fixed!');
    } catch (error) {
        console.error('Error:', error);
    }
}

fixS3Keys();
