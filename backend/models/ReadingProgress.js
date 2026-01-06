const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  },
  lastRead: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
