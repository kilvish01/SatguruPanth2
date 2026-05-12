/**
 * Script to upload book icons to S3 and update DynamoDB with icon URLs
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3 = new AWS.S3({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'BooksMetadata';

// Load the mapping file
const mappingPath = path.join(__dirname, 'book-icons', 'book-icon-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Upload a single icon to S3
async function uploadIconToS3(iconFilename) {
    const iconPath = path.join(__dirname, 'book-icons', iconFilename);
    const fileContent = fs.readFileSync(iconPath);

    const s3Key = `book-icons/${iconFilename}`;

    try {
        await s3.putObject({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'image/svg+xml',
            CacheControl: 'max-age=31536000' // Cache for 1 year
        }).promise();

        // Return the public URL
        const iconUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
        return iconUrl;
    } catch (error) {
        throw new Error(`Failed to upload ${iconFilename}: ${error.message}`);
    }
}

// Get all books from DynamoDB
async function getAllBooks() {
    try {
        const result = await dynamodb.scan({
            TableName: DYNAMO_TABLE,
            FilterExpression: 'entityType = :type',
            ExpressionAttributeValues: {
                ':type': 'BOOK'
            }
        }).promise();

        return result.Items;
    } catch (error) {
        throw new Error(`Failed to get books: ${error.message}`);
    }
}

// Update book metadata with icon URL
async function updateBookIcon(bookId, iconUrl) {
    try {
        await dynamodb.update({
            TableName: DYNAMO_TABLE,
            Key: { BookID: bookId },
            UpdateExpression: 'SET coverImage = :iconUrl',
            ExpressionAttributeValues: {
                ':iconUrl': iconUrl
            }
        }).promise();
    } catch (error) {
        throw new Error(`Failed to update book ${bookId}: ${error.message}`);
    }
}

// Main function to process all books
async function uploadAllIconsAndUpdateDB() {
    console.log('Starting book icon upload and database update...\n');
    console.log(`S3 Bucket: ${S3_BUCKET}`);
    console.log(`DynamoDB Table: ${DYNAMO_TABLE}\n`);

    try {
        // Get all books from DynamoDB
        console.log('Fetching books from DynamoDB...');
        const books = await getAllBooks();
        console.log(`Found ${books.length} books in database\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each book
        for (let i = 0; i < mapping.length; i++) {
            const item = mapping[i];
            const { pdfFilename, iconFilename, hindName } = item;

            try {
                // Find the book in DynamoDB by matching the filename
                const book = books.find(b => {
                    const dbFilename = b.filename || b.title + '.pdf';
                    return dbFilename === pdfFilename || b.title === pdfFilename.replace('.pdf', '');
                });

                if (!book) {
                    console.log(`⚠ Book not found in DB: ${pdfFilename}`);
                    errorCount++;
                    errors.push({ file: pdfFilename, error: 'Not found in database' });
                    continue;
                }

                // Upload icon to S3
                console.log(`[${i + 1}/${mapping.length}] Uploading: ${hindName}...`);
                const iconUrl = await uploadIconToS3(iconFilename);

                // Update DynamoDB with icon URL
                await updateBookIcon(book.BookID, iconUrl);

                console.log(`  ✓ Uploaded to S3: ${iconUrl}`);
                console.log(`  ✓ Updated DB for book: ${book.title} (${book.BookID})\n`);

                successCount++;

            } catch (error) {
                console.error(`  ✗ Error processing ${hindName}: ${error.message}\n`);
                errorCount++;
                errors.push({ file: pdfFilename, error: error.message });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('UPLOAD SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total books processed: ${mapping.length}`);
        console.log(`✓ Successful: ${successCount}`);
        console.log(`✗ Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(err => {
                console.log(`  - ${err.file}: ${err.error}`);
            });
        }

        console.log('\n✓ Icon upload and database update complete!');

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    uploadAllIconsAndUpdateDB()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { uploadIconToS3, updateBookIcon };
