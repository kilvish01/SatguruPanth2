/**
 * Verification script to check if everything is ready for icon upload
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('='.repeat(60));
console.log('BOOK ICONS SETUP VERIFICATION');
console.log('='.repeat(60));
console.log();

let hasErrors = false;

// 1. Check if .env file has AWS credentials
console.log('1. Checking AWS Configuration...');
const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3Bucket = process.env.S3_BUCKET;
const dynamoTable = process.env.DYNAMO_TABLE;

if (!awsAccessKey || awsAccessKey === 'YOUR_NEW_ACCESS_KEY_HERE') {
    console.log('   ✗ AWS_ACCESS_KEY_ID not configured in .env file');
    hasErrors = true;
} else {
    console.log('   ✓ AWS_ACCESS_KEY_ID configured');
}

if (!awsSecretKey || awsSecretKey === 'YOUR_NEW_SECRET_KEY_HERE') {
    console.log('   ✗ AWS_SECRET_ACCESS_KEY not configured in .env file');
    hasErrors = true;
} else {
    console.log('   ✓ AWS_SECRET_ACCESS_KEY configured');
}

if (!s3Bucket) {
    console.log('   ✗ S3_BUCKET not configured');
    hasErrors = true;
} else {
    console.log(`   ✓ S3_BUCKET: ${s3Bucket}`);
}

if (!dynamoTable) {
    console.log('   ✗ DYNAMO_TABLE not configured');
    hasErrors = true;
} else {
    console.log(`   ✓ DYNAMO_TABLE: ${dynamoTable}`);
}

console.log();

// 2. Check if book-icons directory exists
console.log('2. Checking Book Icons Directory...');
const iconsDir = path.join(__dirname, 'book-icons');

if (!fs.existsSync(iconsDir)) {
    console.log('   ✗ book-icons directory not found');
    console.log('   → Run: node generateBookIcons.js');
    hasErrors = true;
} else {
    console.log('   ✓ book-icons directory exists');

    // Count SVG files
    const files = fs.readdirSync(iconsDir);
    const svgFiles = files.filter(f => f.endsWith('.svg'));
    console.log(`   ✓ Found ${svgFiles.length} SVG icon files`);

    if (svgFiles.length !== 36) {
        console.log(`   ⚠ Expected 36 icons, found ${svgFiles.length}`);
    }
}

console.log();

// 3. Check if mapping file exists
console.log('3. Checking Mapping File...');
const mappingPath = path.join(iconsDir, 'book-icon-mapping.json');

if (!fs.existsSync(mappingPath)) {
    console.log('   ✗ book-icon-mapping.json not found');
    hasErrors = true;
} else {
    console.log('   ✓ book-icon-mapping.json exists');

    try {
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        console.log(`   ✓ Mapping file contains ${mapping.length} entries`);

        // Show first 3 entries as sample
        console.log('   ✓ Sample entries:');
        mapping.slice(0, 3).forEach(item => {
            console.log(`      - ${item.hindName} (${item.pdfFilename})`);
        });
    } catch (error) {
        console.log(`   ✗ Error reading mapping file: ${error.message}`);
        hasErrors = true;
    }
}

console.log();

// 4. Check if required scripts exist
console.log('4. Checking Required Scripts...');
const scripts = [
    'generateBookIcons.js',
    'uploadBookIcons.js'
];

scripts.forEach(script => {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
        console.log(`   ✓ ${script} exists`);
    } else {
        console.log(`   ✗ ${script} not found`);
        hasErrors = true;
    }
});

console.log();

// 5. Check if AWS SDK is installed
console.log('5. Checking Dependencies...');
try {
    require('aws-sdk');
    console.log('   ✓ aws-sdk installed');
} catch (error) {
    console.log('   ✗ aws-sdk not installed');
    console.log('   → Run: npm install aws-sdk');
    hasErrors = true;
}

console.log();

// Final summary
console.log('='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (hasErrors) {
    console.log('✗ Setup incomplete - please fix the errors above\n');
    console.log('Next steps:');
    console.log('1. Update AWS credentials in .env file');
    console.log('2. Run: node generateBookIcons.js (if icons not generated)');
    console.log('3. Install dependencies: npm install');
    console.log('4. Re-run this verification: node verifyIconSetup.js');
    console.log('5. Then run: node uploadBookIcons.js');
} else {
    console.log('✓ All checks passed! Ready to upload icons.\n');
    console.log('Next steps:');
    console.log('1. Update S3 bucket policy (see BOOK_ICONS_SETUP.md)');
    console.log('2. Run: node uploadBookIcons.js');
    console.log('3. Verify icons in AWS S3 Console');
    console.log('4. Test in mobile app');
}

console.log();
