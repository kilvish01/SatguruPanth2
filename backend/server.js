const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize books.json if it doesn't exist
const booksFile = path.join(dataDir, 'books.json');
if (!fs.existsSync(booksFile)) {
  fs.writeFileSync(booksFile, JSON.stringify([]));
}

// Initialize progress.json if it doesn't exist
const progressFile = path.join(dataDir, 'progress.json');
if (!fs.existsSync(progressFile)) {
  fs.writeFileSync(progressFile, JSON.stringify([]));
}

app.use('/api', bookRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
  res.send('Satguru Panth Backend Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
