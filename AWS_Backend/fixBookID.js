const AWS = require('aws-sdk');
require('dotenv').config();

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE;

async function fixBookID() {
    try {
        // Update the existing item to have BookID as primary key
        await docClient.put({
            TableName: TABLE_NAME,
            Item: {
                BookID: "1767695680205",
                bookId: "1767695680205",
                entityType: "BOOK",
                title: "Aatmbodh Mala",
                filename: "AatmbodhMala.pdf",
                s3Key: "books/1767695680205-AatmbodhMala.pdf",
                s3Bucket: "book-reader-pdfs",
                fileSize: 2048576,
                contentType: "application/pdf",
                uploadDate: "2024-01-06T10:30:00.000Z",
                viewCount: 0,
                likeCount: 0
            }
        }).promise();
        
        console.log('Book updated with correct BookID');
        
        // Test retrieval
        const result = await docClient.get({
            TableName: TABLE_NAME,
            Key: { BookID: "1767695680205" }
        }).promise();
        
        console.log('Retrieved book:', result.Item ? 'Success' : 'Failed');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixBookID();