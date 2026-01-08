const AWS = require('aws-sdk');
require('dotenv').config();

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

async function checkData() {
    try {
        // Scan to see actual data structure
        const result = await docClient.scan({
            TableName: TABLE_NAME,
            Limit: 1
        }).promise();
        
        console.log('Actual item structure:');
        console.log(JSON.stringify(result.Items[0], null, 2));
        
        // Try to get by bookId value
        const getResult = await docClient.get({
            TableName: TABLE_NAME,
            Key: { BookID: "1767695680205" }
        }).promise();
        
        console.log('\nGet by BookID result:');
        console.log(getResult.Item ? 'Found' : 'Not found');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkData();