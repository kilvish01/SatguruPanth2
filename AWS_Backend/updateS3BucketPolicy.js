/**
 * Script to update S3 bucket policy to allow public read access for book icons
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({ region: 'us-east-1' });
const S3_BUCKET = process.env.S3_BUCKET || 'book-reader-pdfs';

async function updateBucketPolicy() {
    console.log('Updating S3 bucket policy to allow public read for book icons...\n');

    const policy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadBookIcons',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${S3_BUCKET}/book-icons/*`
            }
        ]
    };

    try {
        await s3.putBucketPolicy({
            Bucket: S3_BUCKET,
            Policy: JSON.stringify(policy)
        }).promise();

        console.log('✓ Bucket policy updated successfully!');
        console.log('✓ Book icons are now publicly accessible');
        console.log(`\nTest an icon URL in your browser:`);
        console.log(`https://${S3_BUCKET}.s3.amazonaws.com/book-icons/आत्मबोध.svg`);

    } catch (error) {
        console.error('✗ Error updating bucket policy:', error.message);
        console.log('\nAlternative: Update bucket policy manually in AWS Console:');
        console.log(JSON.stringify(policy, null, 2));
    }
}

if (require.main === module) {
    updateBucketPolicy()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { updateBucketPolicy };
