const fs = require('fs');
const path = require('path');

const booksFile = path.join(__dirname, '../data/books.json');
const progressFile = path.join(__dirname, '../data/progress.json');

const readBooks = () => JSON.parse(fs.readFileSync(booksFile, 'utf8'));
const writeBooks = (books) => fs.writeFileSync(booksFile, JSON.stringify(books, null, 2));
const readProgress = () => JSON.parse(fs.readFileSync(progressFile, 'utf8'));
const writeProgress = (progress) => fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

exports.uploadBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const books = readBooks();
    const book = {
      _id: Date.now().toString(),
      title: req.body.title || req.file.originalname.replace('.pdf', ''),
      filename: req.file.filename,
      filepath: req.file.path,
      uploadDate: new Date().toISOString()
    };

    books.push(book);
    writeBooks(books);
    res.status(201).json({ message: 'Book uploaded successfully', book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const books = readBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const books = readBooks();
    const book = books.find(b => b._id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadBook = async (req, res) => {
  try {
    const books = readBooks();
    const book = books.find(b => b._id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.download(book.filepath, book.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const books = readBooks();
    const bookIndex = books.findIndex(b => b._id === req.params.id);
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = books[bookIndex];
    if (fs.existsSync(book.filepath)) {
      fs.unlinkSync(book.filepath);
    }
    
    books.splice(bookIndex, 1);
    writeBooks(books);

    const progress = readProgress();
    const updatedProgress = progress.filter(p => p.bookId !== req.params.id);
    writeProgress(updatedProgress);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { userId, bookId, currentPage, totalPages } = req.body;
    const progress = readProgress();
    
    const existingIndex = progress.findIndex(p => p.userId === userId && p.bookId === bookId);

    if (existingIndex !== -1) {
      progress[existingIndex].currentPage = currentPage;
      progress[existingIndex].totalPages = totalPages;
      progress[existingIndex].lastRead = new Date().toISOString();
    } else {
      progress.push({
        userId,
        bookId,
        currentPage,
        totalPages,
        lastRead: new Date().toISOString()
      });
    }

    writeProgress(progress);
    res.json({ message: 'Progress updated', progress: progress[existingIndex !== -1 ? existingIndex : progress.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const progress = readProgress();
    const userProgress = progress.find(p => p.userId === userId && p.bookId === bookId);
    
    if (!userProgress) {
      return res.json({ currentPage: 0, totalPages: 0, percentage: 0 });
    }

    const percentage = userProgress.totalPages > 0 
      ? Math.round((userProgress.currentPage / userProgress.totalPages) * 100) 
      : 0;

    res.json({ ...userProgress, percentage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = readProgress();
    const books = readBooks();
    
    const userProgress = progress.filter(p => p.userId === userId);
    
    const progressWithBooks = userProgress.map(p => {
      const book = books.find(b => b._id === p.bookId);
      return {
        ...p,
        bookId: book || { _id: p.bookId, title: 'Unknown' },
        percentage: p.totalPages > 0 ? Math.round((p.currentPage / p.totalPages) * 100) : 0
      };
    });

    res.json(progressWithBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
