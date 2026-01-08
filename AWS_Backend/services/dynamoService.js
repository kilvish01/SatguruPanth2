const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

exports.saveMetadata = async ({ bookId, title, author, userId, fileKey }) => {
    try {
        const item = {
            BookID: bookId,
            entityType: 'BOOK',
            title: title,
            filename: `${title}.pdf`,
            s3Key: fileKey,
            s3Bucket: process.env.S3_BUCKET,
            fileSize: 0, // Will be updated when actual file is uploaded
            contentType: 'application/pdf',
            uploadDate: new Date().toISOString(),
            viewCount: 0,
            likeCount: 0
        };

        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: item
        }).promise();

        return bookId;
    } catch (error) {
        throw new Error(`DynamoDB save failed: ${error.message}`);
    }
};

exports.getMetadata = async (bookId) => {
    try {
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { BookID: bookId }
        }).promise();

        return result.Item;
    } catch (error) {
        throw new Error(`DynamoDB get failed: ${error.message}`);
    }
};

exports.getUserBooks = async (userId) => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();

        return result.Items;
    } catch (error) {
        throw new Error(`DynamoDB scan failed: ${error.message}`);
    }
};

exports.getAllBooks = async () => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();

        return result.Items;
    } catch (error) {
        throw new Error(`Get all books failed: ${error.message}`);
    }
};

exports.incrementViewCount = async (bookId) => {
    try {
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: bookId },
            UpdateExpression: 'ADD viewCount :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();
    } catch (error) {
        throw new Error(`Increment view failed: ${error.message}`);
    }
};

exports.incrementLikeCount = async (bookId) => {
    try {
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: bookId },
            UpdateExpression: 'ADD likeCount :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }).promise();
    } catch (error) {
        throw new Error(`Increment like failed: ${error.message}`);
    }
};

exports.getMostViewed = async (limit = 10) => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();
        
        return result.Items
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, limit);
    } catch (error) {
        throw new Error(`Get most viewed failed: ${error.message}`);
    }
};

exports.getMostLiked = async (limit = 10) => {
    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'BOOK'
            }
        }).promise();
        
        return result.Items
            .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
            .slice(0, limit);
    } catch (error) {
        throw new Error(`Get most liked failed: ${error.message}`);
    }
};