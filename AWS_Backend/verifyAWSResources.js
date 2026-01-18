const AWS = require('aws-sdk');
require('dotenv').config();

// Color codes for terminal output
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const apigatewayv2 = new AWS.ApiGatewayV2();

const VERIFICATION_RESULTS = {
  credentials: false,
  dynamodb: false,
  s3: false,
  lambda: false,
  apiGateway: false
};

// Verify AWS Credentials
async function verifyCredentials() {
  log('\n🔑 Verifying AWS Credentials...', COLORS.BOLD);

  try {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();

    logSuccess('AWS Credentials are valid');
    logInfo(`  Account ID: ${identity.Account}`);
    logInfo(`  User ARN: ${identity.Arn}`);
    logInfo(`  Region: ${AWS.config.region}`);

    VERIFICATION_RESULTS.credentials = true;
    return true;
  } catch (error) {
    logError('Invalid AWS credentials');
    logError(`  Error: ${error.message}`);
    VERIFICATION_RESULTS.credentials = false;
    return false;
  }
}

// Verify DynamoDB Table
async function verifyDynamoDB() {
  log('\n📊 Verifying DynamoDB Table...', COLORS.BOLD);

  const tableName = process.env.DYNAMO_TABLE || 'BooksMetadata';

  try {
    const tableInfo = await dynamodb.describeTable({ TableName: tableName }).promise();

    logSuccess(`DynamoDB table "${tableName}" exists`);
    logInfo(`  Status: ${tableInfo.Table.TableStatus}`);
    logInfo(`  Item Count: ${tableInfo.Table.ItemCount}`);
    logInfo(`  Table Size: ${(tableInfo.Table.TableSizeBytes / 1024).toFixed(2)} KB`);
    logInfo(`  Read Capacity: ${tableInfo.Table.ProvisionedThroughput.ReadCapacityUnits}`);
    logInfo(`  Write Capacity: ${tableInfo.Table.ProvisionedThroughput.WriteCapacityUnits}`);

    // Check Global Secondary Indexes
    if (tableInfo.Table.GlobalSecondaryIndexes) {
      logInfo(`  Global Secondary Indexes: ${tableInfo.Table.GlobalSecondaryIndexes.length}`);
      tableInfo.Table.GlobalSecondaryIndexes.forEach(gsi => {
        logInfo(`    - ${gsi.IndexName} (${gsi.IndexStatus})`);
      });
    }

    // Try to scan for a sample item
    try {
      const scanResult = await dynamodb.scan({
        TableName: tableName,
        Limit: 1
      }).promise();

      if (scanResult.Items && scanResult.Items.length > 0) {
        logSuccess('  Successfully read sample data from table');
      } else {
        logWarning('  Table is empty');
      }
    } catch (scanError) {
      logWarning(`  Could not scan table: ${scanError.message}`);
    }

    VERIFICATION_RESULTS.dynamodb = true;
    return true;
  } catch (error) {
    logError(`DynamoDB table "${tableName}" verification failed`);
    logError(`  Error: ${error.message}`);

    if (error.code === 'ResourceNotFoundException') {
      logError('  Table does not exist');
    }

    VERIFICATION_RESULTS.dynamodb = false;
    return false;
  }
}

// Verify S3 Bucket
async function verifyS3() {
  log('\n🪣 Verifying S3 Bucket...', COLORS.BOLD);

  const bucketName = process.env.S3_BUCKET || 'book-reader-pdfs';

  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    logSuccess(`S3 bucket "${bucketName}" exists and is accessible`);

    // Get bucket location
    try {
      const location = await s3.getBucketLocation({ Bucket: bucketName }).promise();
      logInfo(`  Region: ${location.LocationConstraint || 'us-east-1'}`);
    } catch (e) {
      logWarning(`  Could not get bucket location: ${e.message}`);
    }

    // Check CORS configuration
    try {
      const cors = await s3.getBucketCors({ Bucket: bucketName }).promise();
      if (cors.CORSRules && cors.CORSRules.length > 0) {
        logSuccess('  CORS is configured');
        logInfo(`    Rules: ${cors.CORSRules.length}`);
      }
    } catch (corsError) {
      if (corsError.code === 'NoSuchCORSConfiguration') {
        logWarning('  CORS is not configured');
      } else {
        logWarning(`  Could not check CORS: ${corsError.message}`);
      }
    }

    // List objects to verify access
    try {
      const objects = await s3.listObjectsV2({
        Bucket: bucketName,
        MaxKeys: 10
      }).promise();

      logInfo(`  Total Objects: ${objects.KeyCount}`);

      if (objects.KeyCount > 0) {
        logSuccess('  Successfully listed bucket objects');
        const totalSize = objects.Contents.reduce((sum, obj) => sum + obj.Size, 0);
        logInfo(`    Sample size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      } else {
        logWarning('  Bucket is empty');
      }
    } catch (listError) {
      logWarning(`  Could not list objects: ${listError.message}`);
    }

    VERIFICATION_RESULTS.s3 = true;
    return true;
  } catch (error) {
    logError(`S3 bucket "${bucketName}" verification failed`);
    logError(`  Error: ${error.message}`);

    if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
      logError('  Bucket does not exist');
    } else if (error.code === 'Forbidden') {
      logError('  Access denied - check IAM permissions');
    }

    VERIFICATION_RESULTS.s3 = false;
    return false;
  }
}

// Verify Lambda Functions
async function verifyLambdaFunctions() {
  log('\n⚡ Verifying Lambda Functions...', COLORS.BOLD);

  const functionPrefix = 'book-reader-backend-dev-';
  const expectedFunctions = [
    'getAllBooks',
    'getBook',
    'getMostViewed',
    'getMostLiked',
    'likeBook',
    'uploadBook',
    'getPdf'
  ];

  let allFound = true;

  for (const funcName of expectedFunctions) {
    const fullFunctionName = `${functionPrefix}${funcName}`;

    try {
      const funcConfig = await lambda.getFunctionConfiguration({
        FunctionName: fullFunctionName
      }).promise();

      logSuccess(`Lambda function "${funcName}" exists`);
      logInfo(`  Runtime: ${funcConfig.Runtime}`);
      logInfo(`  Memory: ${funcConfig.MemorySize} MB`);
      logInfo(`  Timeout: ${funcConfig.Timeout}s`);
      logInfo(`  Last Modified: ${funcConfig.LastModified}`);
      logInfo(`  Status: ${funcConfig.State}`);

      if (funcConfig.State !== 'Active') {
        logWarning(`  Function is not active: ${funcConfig.State}`);
      }
    } catch (error) {
      logError(`Lambda function "${funcName}" not found`);
      logError(`  Error: ${error.message}`);
      allFound = false;
    }
  }

  VERIFICATION_RESULTS.lambda = allFound;
  return allFound;
}

// Verify API Gateway
async function verifyAPIGateway() {
  log('\n🌐 Verifying API Gateway...', COLORS.BOLD);

  try {
    // List all APIs
    const apis = await apigatewayv2.getApis().promise();

    // Look for book-reader API
    const bookReaderAPI = apis.Items.find(api =>
      api.Name.includes('book-reader-backend') || api.Name.includes('dev-book-reader-backend')
    );

    if (bookReaderAPI) {
      logSuccess(`API Gateway found: ${bookReaderAPI.Name}`);
      logInfo(`  API ID: ${bookReaderAPI.ApiId}`);
      logInfo(`  Endpoint: ${bookReaderAPI.ApiEndpoint}`);
      logInfo(`  Protocol: ${bookReaderAPI.ProtocolType}`);
      logInfo(`  Created: ${bookReaderAPI.CreatedDate}`);

      // Try to get stages
      try {
        const stages = await apigatewayv2.getStages({
          ApiId: bookReaderAPI.ApiId
        }).promise();

        if (stages.Items && stages.Items.length > 0) {
          logSuccess(`  Stages deployed: ${stages.Items.length}`);
          stages.Items.forEach(stage => {
            logInfo(`    - ${stage.StageName} (${stage.DeploymentId || 'N/A'})`);
          });
        }
      } catch (stageError) {
        logWarning(`  Could not get stages: ${stageError.message}`);
      }

      VERIFICATION_RESULTS.apiGateway = true;
      return true;
    } else {
      logWarning('Book Reader API Gateway not found');
      logInfo(`  Total APIs in region: ${apis.Items.length}`);

      if (apis.Items.length > 0) {
        logInfo('  Available APIs:');
        apis.Items.forEach(api => {
          logInfo(`    - ${api.Name} (${api.ApiId})`);
        });
      }

      VERIFICATION_RESULTS.apiGateway = false;
      return false;
    }
  } catch (error) {
    logError('API Gateway verification failed');
    logError(`  Error: ${error.message}`);
    VERIFICATION_RESULTS.apiGateway = false;
    return false;
  }
}

// Generate final report
function generateReport() {
  log('\n' + '='.repeat(80), COLORS.BOLD);
  log('📋 AWS RESOURCES VERIFICATION REPORT', COLORS.BOLD);
  log('='.repeat(80), COLORS.BOLD);

  const resources = [
    { name: 'AWS Credentials', status: VERIFICATION_RESULTS.credentials },
    { name: 'DynamoDB Table', status: VERIFICATION_RESULTS.dynamodb },
    { name: 'S3 Bucket', status: VERIFICATION_RESULTS.s3 },
    { name: 'Lambda Functions', status: VERIFICATION_RESULTS.lambda },
    { name: 'API Gateway', status: VERIFICATION_RESULTS.apiGateway }
  ];

  log('\nResource Status:');
  log('-'.repeat(80));

  resources.forEach(resource => {
    const status = resource.status ? '✅ HEALTHY' : '❌ FAILED';
    const color = resource.status ? COLORS.GREEN : COLORS.RED;
    log(`${status} | ${resource.name}`, color);
  });

  const totalResources = resources.length;
  const healthyResources = resources.filter(r => r.status).length;
  const failedResources = totalResources - healthyResources;

  log('\n' + '='.repeat(80), COLORS.BOLD);
  log(`\nTotal Resources: ${totalResources}`);
  logSuccess(`Healthy: ${healthyResources}`);
  if (failedResources > 0) {
    logError(`Failed: ${failedResources}`);
  }

  // Overall health status
  if (failedResources === 0) {
    logSuccess('\n🎉 ALL AWS RESOURCES ARE HEALTHY!');
    log('\nYour backend infrastructure is fully operational.', COLORS.GREEN);
  } else {
    logError(`\n⚠️  ${failedResources} resource(s) need attention.`);
    log('\nPlease review the errors above and fix the issues.', COLORS.RED);
  }

  log('\n' + '='.repeat(80), COLORS.BOLD);

  return failedResources === 0;
}

// Main verification function
async function runVerification() {
  log('='.repeat(80), COLORS.BOLD);
  log('🔍 AWS Resources Verification', COLORS.BOLD);
  log('='.repeat(80), COLORS.BOLD);

  // Run all verifications
  await verifyCredentials();
  await verifyDynamoDB();
  await verifyS3();
  await verifyLambdaFunctions();
  await verifyAPIGateway();

  // Generate report
  const allHealthy = generateReport();

  // Exit with appropriate code
  process.exit(allHealthy ? 0 : 1);
}

// Run verification
runVerification().catch(error => {
  logError(`\n❌ Fatal error during verification: ${error.message}`);
  console.error(error);
  process.exit(1);
});
