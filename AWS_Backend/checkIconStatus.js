const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

async function checkBooks() {
    const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BOOK' }
    }).promise();

    const booksWithIcon = result.Items.filter(b => b.coverImage && b.coverImage.startsWith('data:image/svg'));
    const booksWithoutIcon = result.Items.filter(b => {
        return !b.coverImage || !b.coverImage.startsWith('data:image/svg');
    });

    console.log('Total books:', result.Items.length);
    console.log('Books WITH icon:', booksWithIcon.length);
    console.log('Books WITHOUT icon:', booksWithoutIcon.length);

    if (booksWithoutIcon.length > 0) {
        console.log('\nBooks missing icons:');
        booksWithoutIcon.forEach(b => console.log('  -', b.title, '(', b.filename, ')'));
    }
}

checkBooks().catch(console.error);
