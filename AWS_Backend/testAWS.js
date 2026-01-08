const AWS = require('aws-sdk');
require('dotenv').config();

async function testAWSConnection() {
    console.log('Testing AWS connection...');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID);
    
    // Test S3 connection
    const s3 = new AWS.S3();
    try {
        const buckets = await s3.listBuckets().promise();
        console.log('✅ S3 connection successful');
        console.log('Existing buckets:', buckets.Buckets.map(b => b.Name));
    } catch (error) {
        console.log('❌ S3 connection failed:', error.message);
    }
    
    // Test DynamoDB connection
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    try {
        const tables = await new AWS.DynamoDB().listTables().promise();
        console.log('✅ DynamoDB connection successful');
        console.log('Existing tables:', tables.TableNames);
    } catch (error) {
        console.log('❌ DynamoDB connection failed:', error.message);
    }
}

testAWSConnection();