const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET;

async function createS3Bucket() {
    try {
        await s3.createBucket({
            Bucket: BUCKET_NAME
        }).promise();
        
        console.log(`S3 bucket '${BUCKET_NAME}' created successfully`);
    } catch (error) {
        if (error.code === 'BucketAlreadyOwnedByYou') {
            console.log(`S3 bucket '${BUCKET_NAME}' already exists`);
        } else {
            console.error('Error creating S3 bucket:', error.message);
        }
    }
}

createS3Bucket();