require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

// Configure AWS globally before importing services
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Handle base64 PDFs

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Book Reader Backend is running 🚀' });
});

// Routes
app.use('/api/books', bookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3005;

if (process.env.NODE_ENV !== 'lambda') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;