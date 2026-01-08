const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET || 'book-reader-pdfs';

exports.uploadPDF = async (fileContent) => {
    try {
        const buffer = Buffer.from(fileContent, 'base64');
        const fileKey = `pdfs/${uuidv4()}.pdf`;

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: 'application/pdf'
        }).promise();

        return fileKey;
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

exports.getSignedUrl = async (s3Key) => {
    try {
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Expires: 3600 // 1 hour
        };

        return s3.getSignedUrl('getObject', params);
    } catch (error) {
        throw new Error(`Generate signed URL failed: ${error.message}`);
    }
};