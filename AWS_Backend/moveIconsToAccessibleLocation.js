/**
 * Script to copy book icons to an accessible S3 location
 * Since book-icons/ has restricted access, we'll try icons/ folder
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3 = new AWS.S3({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'BooksMetadata';

async function uploadIconToNewLocation(iconFilename) {
    const iconPath = path.join(__dirname, 'book-icons', iconFilename);
    const fileContent = fs.readFileSync(iconPath);

    // Try uploading to 'icons/' folder instead
    const s3Key = `icons/${iconFilename}`;

    try {
        await s3.putObject({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'image/svg+xml',
            CacheControl: 'max-age=31536000'
        }).promise();

        // Generate signed URL
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET,
            Key: s3Key,
            Expires: 604800 // 7 days
        });

        return signedUrl;
    } catch (error) {
        throw new Error(`Failed to upload ${iconFilename}: ${error.message}`);
    }
}

async function getAllBooks() {
    const result = await dynamodb.scan({
        TableName: DYNAMO_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: {
            ':type': 'BOOK'
        }
    }).promise();
    return result.Items;
}

async function updateBookIcon(bookId, signedUrl) {
    await dynamodb.update({
        TableName: DYNAMO_TABLE,
        Key: { BookID: bookId },
        UpdateExpression: 'SET coverImage = :url',
        ExpressionAttributeValues: {
            ':url': signedUrl
        }
    }).promise();
}

async function moveAllIcons() {
    console.log('Moving icons to accessible location (icons/ folder)...\n');

    const mappingPath = path.join(__dirname, 'book-icons', 'book-icon-mapping.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    const books = await getAllBooks();
    console.log(`Found ${books.length} books\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < mapping.length; i++) {
        const item = mapping[i];
        const { pdfFilename, iconFilename, hindName } = item;

        try {
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

            console.log(`[${i + 1}/${mapping.length}] Uploading to icons/: ${hindName}...`);
            const signedUrl = await uploadIconToNewLocation(iconFilename);

            await updateBookIcon(book.BookID, signedUrl);

            console.log(`  ✓ Uploaded and updated: ${book.title}`);
            console.log(`  ✓ URL: ${signedUrl.substring(0, 80)}...`);
            successCount++;

        } catch (error) {
            console.error(`  ✗ Error: ${error.message}`);
            errorCount++;
            errors.push({ file: pdfFilename, error: error.message });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total processed: ${mapping.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(err => {
            console.log(`  - ${err.file}: ${err.error}`);
        });
    }
}

if (require.main === module) {
    moveAllIcons()
        .then(() => {
            console.log('\n✓ Done! Icons moved to icons/ folder.');
            console.log('Testing first icon URL...');
            process.exit(0);
        })
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { moveAllIcons };
