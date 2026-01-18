# Book Reader API Documentation

## Base URL
```
Production: https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev
Local Development: http://localhost:3005
```

## Overview
This is a serverless RESTful API for managing a book reading application. The API is built on AWS Lambda, API Gateway, DynamoDB, and S3.

**Technology Stack:**
- Runtime: Node.js 18.x
- Database: AWS DynamoDB
- Storage: AWS S3
- API Gateway: AWS API Gateway (HTTP API)
- Region: us-east-1

---

## Table of Contents
1. [Get All Books](#1-get-all-books)
2. [Get Book by ID](#2-get-book-by-id)
3. [Get Most Viewed Books](#3-get-most-viewed-books)
4. [Get Most Liked Books](#4-get-most-liked-books)
5. [Like a Book](#5-like-a-book)
6. [Upload Book](#6-upload-book)
7. [Get PDF](#7-get-pdf)
8. [Response Schema](#response-schema)
9. [Error Handling](#error-handling)

---

## API Endpoints

### 1. Get All Books

Retrieve all books from the database.

**Endpoint:** `GET /api/books/all`

**Headers:**
```
Content-Type: application/json
```

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "books": [
    {
      "BookID": "123e4567-e89b-12d3-a456-426614174000",
      "entityType": "BOOK",
      "title": "Sample Book Title",
      "author": "Author Name",
      "filename": "Sample Book Title.pdf",
      "s3Key": "books/123e4567-sample-book-title.pdf",
      "s3Bucket": "book-reader-pdfs",
      "fileSize": 1048576,
      "contentType": "application/pdf",
      "uploadDate": "2024-01-09T10:30:00.000Z",
      "viewCount": 42,
      "likeCount": 15
    }
  ]
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch books",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
curl -X GET https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/all
```

---

### 2. Get Book by ID

Retrieve a specific book by its ID. This endpoint automatically increments the view count and returns a signed S3 URL for the PDF.

**Endpoint:** `GET /api/books/{bookId}`

**Headers:**
```
Content-Type: application/json
```

**Path Parameters:**
- `bookId` (required): UUID of the book

**Success Response (200 OK):**
```json
{
  "BookID": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "BOOK",
  "title": "Sample Book Title",
  "author": "Author Name",
  "filename": "Sample Book Title.pdf",
  "s3Key": "books/123e4567-sample-book-title.pdf",
  "s3Bucket": "book-reader-pdfs",
  "fileSize": 1048576,
  "contentType": "application/pdf",
  "uploadDate": "2024-01-09T10:30:00.000Z",
  "viewCount": 43,
  "likeCount": 15,
  "pdfUrl": "https://book-reader-pdfs.s3.amazonaws.com/books/123e4567-sample-book-title.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "pdfProxyUrl": "https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/123e4567-e89b-12d3-a456-426614174000/pdf"
}
```

**Note:** The `pdfUrl` is a signed S3 URL valid for 1 hour.

**Error Response (404 Not Found):**
```json
{
  "error": "Book not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch book",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
curl -X GET https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/123e4567-e89b-12d3-a456-426614174000
```

---

### 3. Get Most Viewed Books

Retrieve books sorted by view count in descending order.

**Endpoint:** `GET /api/books/popular/viewed`

**Headers:**
```
Content-Type: application/json
```

**Query Parameters:**
- `limit` (optional): Number of books to return (default: 10, max: 100)

**Success Response (200 OK):**
```json
{
  "books": [
    {
      "BookID": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Most Popular Book",
      "author": "Author Name",
      "viewCount": 1250,
      "likeCount": 89,
      "uploadDate": "2024-01-01T10:30:00.000Z"
    }
  ]
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch most viewed books",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
# Get top 5 most viewed books
curl -X GET "https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/popular/viewed?limit=5"
```

---

### 4. Get Most Liked Books

Retrieve books sorted by like count in descending order.

**Endpoint:** `GET /api/books/popular/liked`

**Headers:**
```
Content-Type: application/json
```

**Query Parameters:**
- `limit` (optional): Number of books to return (default: 10, max: 100)

**Success Response (200 OK):**
```json
{
  "books": [
    {
      "BookID": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Most Liked Book",
      "author": "Author Name",
      "viewCount": 890,
      "likeCount": 245,
      "uploadDate": "2024-01-01T10:30:00.000Z"
    }
  ]
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch most liked books",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
# Get top 10 most liked books
curl -X GET "https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/popular/liked?limit=10"
```

---

### 5. Like a Book

Increment the like count for a specific book.

**Endpoint:** `POST /api/books/{bookId}/like`

**Headers:**
```
Content-Type: application/json
```

**Path Parameters:**
- `bookId` (required): UUID of the book

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "message": "Book liked successfully",
  "bookId": "123e4567-e89b-12d3-a456-426614174000",
  "newLikeCount": 16
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to like book",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
curl -X POST https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/123e4567-e89b-12d3-a456-426614174000/like
```

---

### 6. Upload Book

Upload a new PDF book to the system. The file will be stored in S3 and metadata saved to DynamoDB.

**Endpoint:** `POST /api/books/upload`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "file_content": "base64-encoded-pdf-content-here",
  "title": "Book Title",
  "author": "Author Name",
  "userId": "optional-user-id"
}
```

**Required Fields:**
- `file_content`: Base64-encoded PDF file
- `title`: Book title (string)
- `author`: Author name (string)

**Optional Fields:**
- `userId`: User ID who uploaded the book

**Success Response (200 OK):**
```json
{
  "message": "Book uploaded successfully",
  "bookId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Book Title",
  "s3Key": "books/123e4567-book-title.pdf"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: file_content, title, author"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to upload book",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
# First, encode your PDF to base64
# On Linux/Mac: base64 -i yourbook.pdf > encoded.txt

curl -X POST https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "JVBERi0xLjQKJeLjz9MKMyAwIG9iaiA8PC...",
    "title": "My Amazing Book",
    "author": "John Doe"
  }'
```

---

### 7. Get PDF

Retrieve the PDF file content as base64-encoded data.

**Endpoint:** `GET /api/books/{bookId}/pdf`

**Headers:**
```
Content-Type: application/json
```

**Path Parameters:**
- `bookId` (required): UUID of the book

**Success Response (200 OK):**
```
Headers:
  Content-Type: application/pdf

Body: base64-encoded PDF content
```

**Note:** The response body is base64-encoded with `isBase64Encoded: true` flag.

**Error Response (404 Not Found):**
```json
{
  "error": "Book not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch PDF",
  "details": "Error message details"
}
```

**cURL Example:**
```bash
# Download PDF and save to file
curl -X GET https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/123e4567-e89b-12d3-a456-426614174000/pdf \
  --output book.pdf
```

---

## Response Schema

### Book Object
```typescript
{
  BookID: string;              // UUID v4
  entityType: string;          // Always "BOOK"
  title: string;               // Book title
  author: string;              // Author name
  filename: string;            // Original filename
  s3Key: string;              // S3 object key
  s3Bucket: string;           // "book-reader-pdfs"
  fileSize: number;           // Size in bytes
  contentType: string;        // "application/pdf"
  uploadDate: string;         // ISO 8601 timestamp
  viewCount: number;          // Number of views
  likeCount: number;          // Number of likes
  pdfUrl?: string;            // Signed S3 URL (1-hour validity)
  pdfProxyUrl?: string;       // API Gateway proxy URL
}
```

---

## Error Handling

### HTTP Status Codes
- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## CORS Configuration

All endpoints support Cross-Origin Resource Sharing (CORS) with the following headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Rate Limiting

Currently, there are no explicit rate limits on the API. However, AWS Lambda has the following default limits:
- Concurrent executions: 1000 per region
- Request/Response payload: 6 MB

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

**Note:** Consider implementing API keys or JWT authentication for production use.

---

## Best Practices

### 1. Signed URLs
- PDF signed URLs expire after 1 hour
- Always request a fresh URL if the previous one expired
- Use the `/api/books/{bookId}` endpoint to get a new signed URL

### 2. File Uploads
- Maximum file size: 6 MB (Lambda payload limit)
- Only PDF files are supported
- Ensure proper base64 encoding before upload

### 3. Error Handling
- Always check response status codes
- Parse error messages for debugging
- Implement retry logic for 500-level errors

### 4. Performance
- Use pagination for large result sets
- Cache frequently accessed data
- Minimize unnecessary API calls

---

## Testing Endpoints

### Using JavaScript/Node.js
```javascript
const axios = require('axios');

// Get all books
const getAllBooks = async () => {
  try {
    const response = await axios.get(
      'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/all'
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Like a book
const likeBook = async (bookId) => {
  try {
    const response = await axios.post(
      `https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/${bookId}/like`
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

### Using Python
```python
import requests

# Get all books
response = requests.get(
    'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/all'
)
print(response.json())

# Get most viewed books
response = requests.get(
    'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev/api/books/popular/viewed',
    params={'limit': 5}
)
print(response.json())
```

---

## Support and Contact

For issues, questions, or feature requests:
- Check AWS CloudWatch Logs for Lambda function errors
- Review DynamoDB and S3 configurations
- Ensure AWS credentials are valid

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- 7 endpoints for book management
- AWS Lambda + API Gateway deployment
- DynamoDB and S3 integration
- CORS enabled for all endpoints
