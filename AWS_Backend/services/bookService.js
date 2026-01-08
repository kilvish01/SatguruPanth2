const s3Service = require('./s3Service');
const dynamoService = require('./dynamoService');
const { v4: uuidv4 } = require('uuid');

exports.uploadBook = async ({ file_content, title, author, userId }) => {
    try {
        // Upload PDF to S3
        const fileKey = await s3Service.uploadPDF(file_content);
        
        // Save metadata to DynamoDB
        const bookId = uuidv4();
        await dynamoService.saveMetadata({
            bookId,
            title,
            author,
            userId,
            fileKey
        });

        return { 
            message: 'Book uploaded successfully', 
            bookId,
            title,
            author
        };
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
};

exports.getBook = async (bookId) => {
    try {
        const metadata = await dynamoService.getMetadata(bookId);
        if (!metadata) {
            throw new Error('Book not found');
        }

        console.log('Before increment - viewCount:', metadata.viewCount);
        
        // Increment view count when book is accessed
        await dynamoService.incrementViewCount(bookId);
        
        console.log('View count incremented for book:', bookId);

        // Generate pre-signed URL for PDF access
        const pdfUrl = await s3Service.getSignedUrl(metadata.s3Key);
        
        // Get updated metadata to return current view count
        const updatedMetadata = await dynamoService.getMetadata(bookId);
        
        return {
            ...updatedMetadata,
            pdfUrl
        };
    } catch (error) {
        throw new Error(`Get book failed: ${error.message}`);
    }
};

exports.getUserBooks = async (userId) => {
    try {
        return await dynamoService.getUserBooks(userId);
    } catch (error) {
        throw new Error(`Get user books failed: ${error.message}`);
    }
};

exports.getAllBooks = async () => {
    try {
        return await dynamoService.getAllBooks();
    } catch (error) {
        throw new Error(`Get all books failed: ${error.message}`);
    }
};

exports.likeBook = async (bookId) => {
    try {
        await dynamoService.incrementLikeCount(bookId);
        return { message: 'Book liked successfully' };
    } catch (error) {
        throw new Error(`Like book failed: ${error.message}`);
    }
};

exports.getMostViewed = async (limit) => {
    try {
        return await dynamoService.getMostViewed(limit);
    } catch (error) {
        throw new Error(`Get most viewed failed: ${error.message}`);
    }
};

exports.getMostLiked = async (limit) => {
    try {
        return await dynamoService.getMostLiked(limit);
    } catch (error) {
        throw new Error(`Get most liked failed: ${error.message}`);
    }
};