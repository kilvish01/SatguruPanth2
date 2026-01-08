const dynamoService = require('./services/dynamoService');

async function testGetAllBooks() {
    try {
        console.log('Testing getAllBooks...');
        const result = await dynamoService.getAllBooks();
        console.log('Success! Found', result.length, 'books');
        console.log('Books:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        
        // Test scan without filter
        const AWS = require('aws-sdk');
        require('dotenv').config();
        
        const dynamodb = new AWS.DynamoDB.DocumentClient({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        
        try {
            console.log('\nTesting raw scan...');
            const rawResult = await dynamodb.scan({
                TableName: 'BooksMetadata'
            }).promise();
            console.log('Raw scan found', rawResult.Items.length, 'items');
            rawResult.Items.forEach(item => {
                console.log('Item entityType:', item.entityType);
            });
        } catch (rawError) {
            console.error('Raw scan error:', rawError.message);
        }
    }
}

testGetAllBooks();