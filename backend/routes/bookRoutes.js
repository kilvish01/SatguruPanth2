const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bookController = require('../controllers/bookController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', upload.single('pdf'), bookController.uploadBook);
router.get('/books', bookController.getAllBooks);
router.get('/books/:id', bookController.getBook);
router.get('/books/:id/download', bookController.downloadBook);
router.delete('/books/:id', bookController.deleteBook);
router.post('/progress', bookController.updateProgress);
router.get('/progress/:userId/:bookId', bookController.getProgress);
router.get('/progress/:userId', bookController.getUserProgress);

module.exports = router;
