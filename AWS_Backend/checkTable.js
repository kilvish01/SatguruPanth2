const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

async function checkTable() {
    try {
        // Check table structure
        const tableInfo = await dynamodb.describeTable({
            TableName: TABLE_NAME
        }).promise();
        
        console.log('Table Key Schema:', tableInfo.Table.KeySchema);
        console.log('Attribute Definitions:', tableInfo.Table.AttributeDefinitions);
        
        // Check existing data
        const items = await docClient.scan({
            TableName: TABLE_NAME,
            Limit: 5
        }).promise();
        
        console.log('\nExisting items:');
        items.Items.forEach(item => {
            console.log('BookId:', item.BookId, 'Type:', typeof item.BookId);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTable();