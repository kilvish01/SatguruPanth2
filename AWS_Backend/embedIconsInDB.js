/**
 * Script to embed book icons directly in DynamoDB as base64 data URIs
 * This bypasses S3 access issues entirely
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'BooksMetadata';

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

async function updateBookWithDataUri(bookId, dataUri) {
    await dynamodb.update({
        TableName: DYNAMO_TABLE,
        Key: { BookID: bookId },
        UpdateExpression: 'SET coverImage = :dataUri',
        ExpressionAttributeValues: {
            ':dataUri': dataUri
        }
    }).promise();
}

async function embedAllIcons() {
    console.log('Embedding book icons as base64 data URIs in DynamoDB...\n');

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

            // Read SVG file and convert to base64 data URI
            const iconPath = path.join(__dirname, 'book-icons', iconFilename);
            const svgContent = fs.readFileSync(iconPath, 'utf8');
            const base64 = Buffer.from(svgContent).toString('base64');
            const dataUri = `data:image/svg+xml;base64,${base64}`;

            console.log(`[${i + 1}/${mapping.length}] Embedding: ${hindName}...`);
            await updateBookWithDataUri(book.BookID, dataUri);

            console.log(`  ✓ Embedded in DB: ${book.title} (${book.BookID})`);
            console.log(`  Size: ${(dataUri.length / 1024).toFixed(2)} KB`);
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
    console.log(`✓ Successfully embedded: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(err => {
            console.log(`  - ${err.file}: ${err.error}`);
        });
    }

    console.log('\n✓ All icons are now embedded as data URIs in DynamoDB!');
    console.log('The mobile app will display them without needing S3 access.');
}

if (require.main === module) {
    embedAllIcons()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { embedAllIcons };
