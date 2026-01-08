const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

async function debugGetBook() {
    try {
        console.log('Testing getMetadata with BookID: 1767695680205');
        
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { BookID: "1767695680205" }
        }).promise();
        
        console.log('DynamoDB response:', JSON.stringify(result, null, 2));
        console.log('Item exists:', !!result.Item);
        
        if (result.Item) {
            console.log('Book found successfully');
        } else {
            console.log('Book not found - checking all items...');
            
            // Scan all items to see what's there
            const scanResult = await dynamodb.scan({
                TableName: TABLE_NAME
            }).promise();
            
            console.log('All items in table:');
            scanResult.Items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugGetBook();