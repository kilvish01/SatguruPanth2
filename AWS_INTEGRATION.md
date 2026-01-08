# AWS Lambda Integration Setup

Your AWS Lambda backend has been integrated with the frontend application.

## API Endpoints Integrated

1. **Get All Books**: `GET /api/books/all`
2. **Get Book by ID**: `GET /api/books/{bookId}` (includes view count increment)
3. **Get Most Viewed**: `GET /api/books/popular/viewed?limit=10`
4. **Get Most Liked**: `GET /api/books/popular/liked?limit=10`
5. **Like Book**: `POST /api/books/{bookId}/like`

## Setup Instructions

### Step 1: Get Your API Gateway URL

Run this command to get your deployed API Gateway URL:

```bash
./get-api-url.sh
```

Or manually:

```bash
cd AWS_Backend
serverless info --verbose
```

Look for the `ServiceEndpoint` in the output. It will look like:
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

### Step 2: Update Configuration

Open `src/config/api.config.ts` and replace `YOUR_AWS_API_GATEWAY_URL_HERE` with your actual API Gateway URL:

```typescript
export const API_CONFIG = {
  AWS_API_URL: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};
```

### Step 3: Usage in Your App

The `bookAPI` service in `src/services/bookService.ts` now includes:

```typescript
// Get all books
const books = await bookAPI.getAllBooks();

// Get specific book (increments view count automatically)
const book = await bookAPI.getBook(bookId);

// Get most viewed books
const mostViewed = await bookAPI.getMostViewed(10);

// Get most liked books
const mostLiked = await bookAPI.getMostLiked(10);

// Like a book
await bookAPI.likeBook(bookId);
```

## Response Format

All Lambda functions return data in this format:
```json
{
  "statusCode": 200,
  "body": "JSON string of actual data"
}
```

The bookService automatically parses the response body for you.

## Book Data Structure

```typescript
{
  BookID: string,
  title: string,
  author: string,
  description: string,
  s3Bucket: string,
  s3Key: string,
  pdfUrl: string,  // Signed URL (valid for 1 hour)
  viewCount: number,
  likeCount: number,
  uploadedAt: string,
  entityType: "BOOK"
}
```

## Testing

After updating the API URL, test the integration:

```bash
npx expo start
```

Then in your app, try fetching books to verify the connection works.
