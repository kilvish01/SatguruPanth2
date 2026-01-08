const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

// POST: Upload a book
router.post('/upload', async (req, res) => {
    try {
        const { file_content, title, author, userId } = req.body;
        
        if (!file_content || !title || !author) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await bookService.uploadBook({ file_content, title, author, userId });
        res.status(200).json(result);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Get all books - MUST BE FIRST
router.get('/all', async (req, res) => {
    try {
        const result = await bookService.getAllBooks();
        res.status(200).json(result);
    } catch (error) {
        console.error('Get all books error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Most viewed books
router.get('/popular/viewed', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await bookService.getMostViewed(limit);
        res.status(200).json(result);
    } catch (error) {
        console.error('Get most viewed error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Most liked books
router.get('/popular/liked', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await bookService.getMostLiked(limit);
        res.status(200).json(result);
    } catch (error) {
        console.error('Get most liked error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: List all books for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await bookService.getUserBooks(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Get user books error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Like a book
router.post('/:bookId/like', async (req, res) => {
    try {
        const { bookId } = req.params;
        const result = await bookService.likeBook(bookId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Like book error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Get book by ID - MUST BE LAST
router.get('/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const result = await bookService.getBook(bookId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Get book error:', error);
        res.status(404).json({ error: error.message });
    }
});

module.exports = router;