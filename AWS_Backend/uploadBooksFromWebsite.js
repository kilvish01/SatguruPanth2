const AWS = require('aws-sdk');
const axios = require('axios');
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

// Author for all books
const AUTHOR = "परम संत सद्‌गुरु वक्त सुरेशादयाल जी महाराज";
const BASE_URL = "https://satgurupanth.org";

// All books from the website
const ALL_BOOKS = [
  { title: "आत्मबोध", url: "assets/images/Aatmbodh-.pdf" },
  { title: "सत्संग माला", url: "assets/images/SathSang Mala.pdf" },
  { title: "आत्मबोध माला", url: "assets/images/AatmbodhMala.pdf" },
  { title: "सार वाणी", url: "assets/images/Saar Vani.pdf" },
  { title: "सत्य पथ", url: "assets/images/Satya Path.pdf" },
  { title: "मुक्ति - पथ", url: "assets/images/Mukti_Path.pdf" },
  { title: "सार का सार", url: "assets/images/Saar Ka Saar.pdf" },
  { title: "नामदान का सार", url: "assets/images/Naam daan ka saar.pdf" },
  { title: "सतज्ञान को जानें", url: "assets/images/satgyankojane.pdf" },
  { title: "मूल ज्ञान ही सार है", url: "assets/images/Mool gyaan hi saar.pdf" },
  { title: "पूर्ण अध्यात्मिक सफर", url: "assets/images/poorn Adhyatmik Safar.pdf" },
  { title: "मन की धार पलटो", url: "assets/images/Maan ki dhara palto.pdf" },
  { title: "परम वाणी", url: "assets/images/ParamVarhi.pdf" },
  { title: "सद्‌गुरु - महिमा", url: "assets/images/sadguru mahima.pdf" },
  { title: "परमज्ञान", url: "assets/images/Paramgyaan.pdf" },
  { title: "कल्कि - अवतरण", url: "assets/images/kalki Avtaran.pdf" },
  { title: "गीता-सार", url: "assets/images/GeetaSaar.pdf" },
  { title: "अद्वैत भक्ति", url: "assets/images/Advaita_Bhakti.pdf" },
  { title: "राम कृपा", url: "assets/images/Ram_Kripa.pdf" },
  { title: "सतनाम", url: "assets/images/Satnam.pdf" },
  { title: "सतगुरु पंथ", url: "assets/images/Satguru Panth.pdf" },
  { title: "अपरोक्ष भक्ति", url: "assets/images/Aproksh Bhakti.pdf" },
  { title: "सत्य खोजो", url: "assets/images/Satya_Khoj.pdf" },
  { title: "प्रार्थना", url: "assets/images/Prathna.pdf" },
  { title: "फकीर", url: "assets/images/Fakir.pdf" },
  { title: "धार कैसी है", url: "assets/images/Dhar_Kaise.pdf" },
  { title: "कलयुग का निःकलंक अवतार", url: "assets/images/Kalyug_Ka_Nilkalank.pdf" },
  { title: "आध्यात्मिक प्रश्नोत्तरी", url: "assets/images/adhyatmikPatori.pdf" },
  { title: "सतगुरु पंथ की खोज", url: "assets/images/Satguru_Panth_Ki_Khoj.pdf" },
  { title: "सद्‌गुरु की चेतावनी", url: "assets/images/satguruKiChetavni.pdf" },
  { title: "जीव का धर्म युद्ध", url: "assets/images/Jeev ka Dharm Yudh.pdf" },
  { title: "अज्ञानी - जीव", url: "assets/images/Agayani Jeev.pdf" },
  { title: "नामदान की तैयारी", url: "assets/images/Naamdaan ki tayiyari.pdf" },
  { title: "अन्दर से धोय डारौ तो जानी", url: "assets/images/Andar se dhoye daro tou jane.pdf" },
  { title: "सहज-पथ", url: "assets/images/Sahaj Path.pdf" },
  { title: "अध्यात्म का खेल", url: "assets/images/Adhyatma ka khel.pdf" }
];

// Books already in database (to skip)
const EXISTING_BOOKS = [
  "आत्मबोध",
  "सत्संग माला",
  "आत्मबोध माला",
  "सार वाणी",
  "सत्य पथ"
];

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
    return EXISTING_BOOKS;
  }
}

async function downloadPDF(url) {
  try {
    const fullUrl = `${BASE_URL}/${url}`;
    console.log(`  Downloading from: ${fullUrl}`);

    const response = await axios({
      method: 'get',
      url: fullUrl,
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error(`  Failed to download: ${error.message}`);
    throw error;
  }
}

async function uploadToS3(buffer, filename) {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `books/${filename}`,
    Body: buffer,
    ContentType: 'application/pdf'
  };

  try {
    const result = await s3.putObject(params).promise();
    console.log(`  Uploaded to S3: books/${filename}`);
    return `books/${filename}`;
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

async function processBook(book, index) {
  console.log(`\n[${index + 1}] Processing: ${book.title}`);

  try {
    // Download PDF
    const pdfBuffer = await downloadPDF(book.url);
    console.log(`  Downloaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Generate filename
    const filename = path.basename(book.url);

    // Upload to S3
    const s3Key = await uploadToS3(pdfBuffer, filename);

    // Generate BookID
    const bookId = uuidv4();

    // Save metadata
    await saveMetadataToDynamoDB({
      bookId: bookId,
      title: book.title,
      author: AUTHOR,
      filename: filename,
      s3Key: s3Key,
      fileSize: pdfBuffer.length
    });

    console.log(`  ✅ Successfully processed: ${book.title}`);
    return { success: true, title: book.title };
  } catch (error) {
    console.error(`  ❌ Failed to process: ${book.title}`);
    console.error(`  Error: ${error.message}`);
    return { success: false, title: book.title, error: error.message };
  }
}

async function main() {
  console.log('=================================================');
  console.log('Book Upload Script - satgurupanth.org to AWS');
  console.log('=================================================\n');

  // Get current books from database
  console.log('Fetching current books from database...');
  const existingBooks = await getCurrentBooks();
  console.log(`Found ${existingBooks.length} existing books in database\n`);

  // Filter out existing books
  const booksToUpload = ALL_BOOKS.filter(book => !existingBooks.includes(book.title));

  console.log(`Books to upload: ${booksToUpload.length}`);
  console.log(`Books already in database: ${existingBooks.length}`);
  console.log('\n=================================================\n');

  if (booksToUpload.length === 0) {
    console.log('All books are already in the database! ✅');
    return;
  }

  // Process each book
  const results = [];
  for (let i = 0; i < booksToUpload.length; i++) {
    const result = await processBook(booksToUpload[i], i);
    results.push(result);

    // Small delay between uploads to avoid rate limiting
    if (i < booksToUpload.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  if (failed.length > 0) {
    console.log('\nFailed books:');
    failed.forEach(f => {
      console.log(`  - ${f.title}: ${f.error}`);
    });
  }

  console.log('\n=================================================');
  console.log('Upload process completed!');
  console.log('=================================================');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
