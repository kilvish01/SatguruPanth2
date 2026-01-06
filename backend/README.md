# BrahmGyan Backend Setup

## Prerequisites
- Node.js installed
- MongoDB installed and running

## Installation Steps

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB (if not running):
```bash
mongod
```

4. Start the server:
```bash
npm start
```

Server will run on http://localhost:3000

## Admin Panel

Open `admin.html` in your browser to upload books:
```bash
open admin.html
```

Or navigate to: `file:///path/to/backend/admin.html`

## API Endpoints

- `POST /api/upload` - Upload a PDF book
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `GET /api/books/:id/download` - Download book
- `DELETE /api/books/:id` - Delete book
- `POST /api/progress` - Update reading progress
- `GET /api/progress/:userId/:bookId` - Get progress for specific book
- `GET /api/progress/:userId` - Get all progress for user

## Frontend Integration

The frontend is already configured to connect to the backend at `http://localhost:3000/api`

Books will automatically appear in the app once uploaded through the admin panel.
