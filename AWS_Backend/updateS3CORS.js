const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
            MaxAgeSeconds: 3000
        }
    ]
};

async function updateCORS() {
    try {
        await s3.putBucketCors({
            Bucket: 'book-reader-pdfs',
            CORSConfiguration: corsConfiguration
        }).promise();
        
        console.log('✅ CORS configuration updated successfully!');
    } catch (error) {
        console.error('Error updating CORS:', error);
    }
}

updateCORS();
