require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// AWS Configuration
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

const TABLE_NAME = 'BooksMetadata';
const BUCKET_NAME = 'book-reader-pdfs';

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Book Reader Backend is running 🚀' });
});

// Get all books
app.get('/api/books/all', async (req, res) => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();
        
        res.json(result.Items);
    } catch (error) {
        console.error('Get all books error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific book
app.get('/api/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        // Get book metadata
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { BookID: bookId }
        }).promise();
        
        if (!result.Item) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Increment view count
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: bookId },
            UpdateExpression: 'ADD viewCount :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();
        
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
        console.error('Get book error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Like a book
app.post('/api/books/:bookId/like', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: bookId },
            UpdateExpression: 'ADD likeCount :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();
        
        res.json({ message: 'Book liked successfully' });
    } catch (error) {
        console.error('Like book error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET / (health check)');
    console.log('- GET /api/books/all');
    console.log('- GET /api/books/:bookId');
    console.log('- POST /api/books/:bookId/like');
});

module.exports = app;