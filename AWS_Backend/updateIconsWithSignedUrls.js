/**
 * Script to update DynamoDB with signed URLs for book icons
 * This is a workaround since we can't make S3 icons public or update Lambda easily
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'BooksMetadata';

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

async function updateBookWithSignedUrl(bookId, coverImageUrl) {
    // Extract icon key from the coverImage URL
    const iconKey = coverImageUrl.split('.com/')[1] || coverImageUrl.split('amazonaws.com/')[1];

    if (!iconKey || !iconKey.includes('book-icons/')) {
        return null;
    }

    try {
        // Generate signed URL (valid for 7 days)
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET,
            Key: iconKey,
            Expires: 604800 // 7 days in seconds
        });

        // Update DynamoDB with signed URL
        await dynamodb.update({
            TableName: DYNAMO_TABLE,
            Key: { BookID: bookId },
            UpdateExpression: 'SET coverImage = :signedUrl',
            ExpressionAttributeValues: {
                ':signedUrl': signedUrl
            }
        }).promise();

        return signedUrl;
    } catch (error) {
        throw new Error(`Failed to update book ${bookId}: ${error.message}`);
    }
}

async function updateAllIconsWithSignedUrls() {
    console.log('Updating all book icons with signed URLs...\n');
    console.log(`S3 Bucket: ${S3_BUCKET}`);
    console.log(`DynamoDB Table: ${DYNAMO_TABLE}\n`);

    try {
        const books = await getAllBooks();
        console.log(`Found ${books.length} books\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const book of books) {
            if (!book.coverImage || !book.coverImage.includes('book-icons/')) {
                skipCount++;
                continue;
            }

            try {
                const signedUrl = await updateBookWithSignedUrl(book.BookID, book.coverImage);

                if (signedUrl) {
                    console.log(`✓ Updated: ${book.title}`);
                    console.log(`  BookID: ${book.BookID}`);
                    console.log(`  Signed URL: ${signedUrl.substring(0, 100)}...`);
                    successCount++;
                } else {
                    skipCount++;
                }
            } catch (error) {
                console.error(`✗ Error updating ${book.title}: ${error.message}`);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('UPDATE SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total books: ${books.length}`);
        console.log(`✓ Updated with signed URLs: ${successCount}`);
        console.log(`⊘ Skipped (no icon): ${skipCount}`);
        console.log(`✗ Errors: ${errorCount}`);
        console.log('\n✓ All books updated with signed URLs!');
        console.log('\nNote: Signed URLs are valid for 7 days.');
        console.log('Run this script again after 7 days to refresh URLs.');

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    updateAllIconsWithSignedUrls()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { updateAllIconsWithSignedUrls };
