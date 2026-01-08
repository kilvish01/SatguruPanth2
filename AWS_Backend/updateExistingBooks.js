const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

async function addCountsToExistingBooks() {
    try {
        // Get all existing books
        const result = await dynamodb.scan({
            TableName: TABLE_NAME
        }).promise();

        // Update each book to add ViewCount and LikeCount if missing
        for (const book of result.Items) {
            if (!book.ViewCount && !book.LikeCount) {
                await dynamodb.update({
                    TableName: TABLE_NAME,
                    Key: { BookId: book.BookId },
                    UpdateExpression: 'SET ViewCount = :zero, LikeCount = :zero',
                    ExpressionAttributeValues: {
                        ':zero': 0
                    }
                }).promise();
                
                console.log(`Updated book: ${book.Title}`);
            }
        }
        
        console.log('All existing books updated with ViewCount and LikeCount');
    } catch (error) {
        console.error('Error updating books:', error);
    }
}

// Run the update
addCountsToExistingBooks();