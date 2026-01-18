const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const AUTHOR = "परम संत सद्‌गुरु वक्त सुरेशादयाल जी महाराज";
const DOWNLOAD_DIR = path.join(__dirname, 'downloaded_books');

// Map of filenames to book titles
const BOOK_TITLES = {
  "Aatmbodh-.pdf": "आत्मबोध",
  "SathSang Mala.pdf": "सत्संग माला",
  "AatmbodhMala.pdf": "आत्मबोध माला",
  "Saar Vani.pdf": "सार वाणी",
  "Satya Path.pdf": "सत्य पथ",
  "Mukti_Path.pdf": "मुक्ति - पथ",
  "Saar Ka Saar.pdf": "सार का सार",
  "Naam daan ka saar.pdf": "नामदान का सार",
  "satgyankojane.pdf": "सतज्ञान को जानें",
  "Mool gyaan hi saar.pdf": "मूल ज्ञान ही सार है",
  "poorn Adhyatmik Safar.pdf": "पूर्ण अध्यात्मिक सफर",
  "Maan ki dhara palto.pdf": "मन की धार पलटो",
  "ParamVarhi.pdf": "परम वाणी",
  "sadguru mahima.pdf": "सद्‌गुरु - महिमा",
  "Paramgyaan.pdf": "परमज्ञान",
  "kalki Avtaran.pdf": "कल्कि - अवतरण",
  "GeetaSaar.pdf": "गीता-सार",
  "Advaita_Bhakti.pdf": "अद्वैत भक्ति",
  "Ram_Kripa.pdf": "राम कृपा",
  "Satnam.pdf": "सतनाम",
  "Satguru Panth.pdf": "सतगुरु पंथ",
  "Aproksh Bhakti.pdf": "अपरोक्ष भक्ति",
  "Satya_Khoj.pdf": "सत्य खोजो",
  "Prathna.pdf": "प्रार्थना",
  "Fakir.pdf": "फकीर",
  "Dhar_Kaise.pdf": "धार कैसी है",
  "Kalyug_Ka_Nilkalank.pdf": "कलयुग का निःकलंक अवतार",
  "adhyatmikPatori.pdf": "आध्यात्मिक प्रश्नोत्तरी",
  "Satguru_Panth_Ki_Khoj.pdf": "सतगुरु पंथ की खोज",
  "satguruKiChetavni.pdf": "सद्‌गुरु की चेतावनी",
  "Jeev ka Dharm Yudh.pdf": "जीव का धर्म युद्ध",
  "Agayani Jeev.pdf": "अज्ञानी - जीव",
  "Naamdaan ki tayiyari.pdf": "नामदान की तैयारी",
  "Andar se dhoye daro tou jane.pdf": "अन्दर से धोय डारौ तो जानी",
  "Sahaj Path.pdf": "सहज-पथ",
  "Adhyatma ka khel.pdf": "अध्यात्म का खेल"
};

async function getCurrentBooks() {
  try {
    const result = await dynamodb.scan({
      TableName: process.env.DYNAMO_TABLE,
      FilterExpression: 'entityType = :type',
      ExpressionAttributeValues: { ':type': 'BOOK' }
    }).promise();

    return result.Items.map(item => item.title);
  } catch (error) {
    console.error('Error fetching current books:', error);
    return [];
  }
}

async function uploadToS3(filepath, filename) {
  const fileBuffer = fs.readFileSync(filepath);

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `books/${filename}`,
    Body: fileBuffer,
    ContentType: 'application/pdf'
  };

  try {
    await s3.putObject(params).promise();
    console.log(`  Uploaded to S3: books/${filename}`);
    return { s3Key: `books/${filename}`, fileSize: fileBuffer.length };
  } catch (error) {
    console.error(`  S3 upload failed: ${error.message}`);
    throw error;
  }
}

async function saveMetadataToDynamoDB(bookData) {
  const params = {
    TableName: process.env.DYNAMO_TABLE,
    Item: {
      BookID: bookData.bookId,
      entityType: 'BOOK',
      title: bookData.title,
      author: bookData.author,
      filename: bookData.filename,
      s3Key: bookData.s3Key,
      s3Bucket: process.env.S3_BUCKET,
      fileSize: bookData.fileSize,
      contentType: 'application/pdf',
      uploadDate: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0
    }
  };

  try {
    await dynamodb.put(params).promise();
    console.log(`  Saved metadata to DynamoDB with BookID: ${bookData.bookId}`);
  } catch (error) {
    console.error(`  DynamoDB save failed: ${error.message}`);
    throw error;
  }
}

async function processLocalBook(filename, title, index, total) {
  console.log(`\n[${index + 1}/${total}] Processing: ${title}`);

  const filepath = path.join(DOWNLOAD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`  ❌ File not found: ${filepath}`);
    return { success: false, title: title, error: 'File not found' };
  }

  try {
    const stats = fs.statSync(filepath);
    console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Upload to S3
    const { s3Key, fileSize } = await uploadToS3(filepath, filename);

    // Generate BookID
    const bookId = uuidv4();

    // Save metadata
    await saveMetadataToDynamoDB({
      bookId: bookId,
      title: title,
      author: AUTHOR,
      filename: filename,
      s3Key: s3Key,
      fileSize: fileSize
    });

    console.log(`  ✅ Successfully processed: ${title}`);
    return { success: true, title: title };
  } catch (error) {
    console.error(`  ❌ Failed to process: ${title}`);
    console.error(`  Error: ${error.message}`);
    return { success: false, title: title, error: error.message };
  }
}

async function main() {
  console.log('=================================================');
  console.log('Book Upload Script - Local Files to AWS');
  console.log('=================================================\n');

  // Check if download directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    console.error(`Error: Directory not found: ${DOWNLOAD_DIR}`);
    console.error('Please run downloadBooksLocally.js first!');
    process.exit(1);
  }

  // Get current books from database
  console.log('Fetching current books from database...');
  const existingBooks = await getCurrentBooks();
  console.log(`Found ${existingBooks.length} existing books in database\n`);

  // Get all PDF files from download directory
  const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files in download directory\n`);

  // Filter out books already in database
  const booksToUpload = [];
  for (const filename of files) {
    const title = BOOK_TITLES[filename];
    if (!title) {
      console.log(`  ⚠️  Unknown file: ${filename} (skipping)`);
      continue;
    }
    if (!existingBooks.includes(title)) {
      booksToUpload.push({ filename, title });
    } else {
      console.log(`  ⏭️  Already exists: ${title}`);
    }
  }

  console.log(`\nBooks to upload: ${booksToUpload.length}`);
  console.log(`Books already in database: ${existingBooks.length}`);
  console.log('\n=================================================\n');

  if (booksToUpload.length === 0) {
    console.log('All books are already in the database! ✅');
    return;
  }

  // Process each book
  const results = [];
  for (let i = 0; i < booksToUpload.length; i++) {
    const book = booksToUpload[i];
    const result = await processLocalBook(
      book.filename,
      book.title,
      i,
      booksToUpload.length
    );
    results.push(result);

    // Small delay between uploads
    if (i < booksToUpload.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n=================================================');
  console.log('UPLOAD SUMMARY');
  console.log('=================================================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully uploaded: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\nSuccessfully uploaded books:');
    successful.forEach(s => {
      console.log(`  ✅ ${s.title}`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed books:');
    failed.forEach(f => {
      console.log(`  ❌ ${f.title}: ${f.error}`);
    });
  }

  console.log('\n=================================================');
  console.log('Upload process completed!');
  console.log('=================================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
