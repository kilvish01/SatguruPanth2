require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');

const app = express();
app.use(express.json());

// Configure AWS with explicit credentials
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server working!' });
});

// Get all books
app.get('/api/books/all', async (req, res) => {
    try {
        const result = await dynamodb.scan({
            TableName: 'BooksMetadata',
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();
        
        res.json(result.Items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific book
app.get('/api/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        const result = await dynamodb.get({
            TableName: 'BooksMetadata',
            Key: { BookID: bookId }
        }).promise();
        
        if (!result.Item) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Generate signed URL
        const pdfUrl = s3.getSignedUrl('getObject', {
            Bucket: result.Item.s3Bucket,
            Key: result.Item.s3Key,
            Expires: 3600
        });
        
        res.json({
            ...result.Item,
            pdfUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Test endpoints:');
    console.log('- GET /test');
    console.log('- GET /api/books/all');
    console.log('- GET /api/books/1767695680205');
});

module.exports = app;