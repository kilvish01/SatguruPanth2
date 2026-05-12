# Book Icons Setup Guide

This guide explains how to upload unique spiritual book icons to S3 and link them with DynamoDB.

## Overview

Each book now has a unique spiritual icon with:
- **Hindi name** as the visual title
- **Unique spiritual theme** (Om symbol, lotus, yantra, etc.)
- **Unique color gradient** for easy visual distinction
- **SVG format** for crisp rendering at any size

## What Was Created

### 1. Icon Generator Script
**File**: `generateBookIcons.js`

Generates 36 unique SVG icons, one for each book:
- Each icon has a Hindi name
- Unique spiritual symbols/themes
- Different color gradients
- High-quality SVG format

### 2. Upload Script
**File**: `uploadBookIcons.js`

Uploads icons to S3 and updates DynamoDB with icon URLs:
- Uploads SVG files to S3 bucket
- Sets public-read ACL for direct access
- Updates book metadata in DynamoDB
- Maps icons to books by filename

### 3. Generated Icons
**Directory**: `book-icons/`

Contains:
- 36 SVG icon files with Hindi names
- `book-icon-mapping.json` - mapping file linking PDFs to icons

## Step-by-Step Setup

### Step 1: Configure AWS Credentials

Update the `.env` file with your AWS credentials:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
S3_BUCKET=book-reader-pdfs
DYNAMO_TABLE=BooksMetadata
```

**Important**: Make sure your AWS IAM user has permissions for:
- S3: `PutObject`, `PutObjectAcl`, `GetObject`
- DynamoDB: `Scan`, `UpdateItem`

### Step 2: Update S3 Bucket Policy

Add this bucket policy to allow public read access to book icons:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadBookIcons",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::book-reader-pdfs/book-icons/*"
    }
  ]
}
```

Apply this policy in AWS S3 Console:
1. Go to S3 > book-reader-pdfs bucket
2. Click "Permissions" tab
3. Scroll to "Bucket Policy"
4. Add the above policy
5. Save changes

### Step 3: Generate Icons (Already Done)

Icons are already generated, but if you need to regenerate:

```bash
cd AWS_Backend
node generateBookIcons.js
```

This creates 36 icons in `book-icons/` directory.

### Step 4: Upload Icons to S3 and Update DynamoDB

Run the upload script:

```bash
cd AWS_Backend
node uploadBookIcons.js
```

This will:
1. Read all books from DynamoDB
2. Upload each icon to S3 (`book-icons/` folder)
3. Update each book's `coverImage` field with the S3 URL
4. Display progress and summary

Expected output:
```
Starting book icon upload and database update...

S3 Bucket: book-reader-pdfs
DynamoDB Table: BooksMetadata

Fetching books from DynamoDB...
Found 36 books in database

[1/36] Uploading: आत्मबोध...
  ✓ Uploaded to S3: https://book-reader-pdfs.s3.amazonaws.com/book-icons/आत्मबोध.svg
  ✓ Updated DB for book: Aatmbodh (abc-123-def)

...

============================================================
UPLOAD SUMMARY
============================================================
Total books processed: 36
✓ Successful: 36
✗ Errors: 0

✓ Icon upload and database update complete!
```

### Step 5: Verify in AWS Console

#### S3 Verification:
1. Go to AWS S3 Console
2. Open `book-reader-pdfs` bucket
3. Navigate to `book-icons/` folder
4. You should see 36 SVG files with Hindi names
5. Click any file > Object URL to verify it loads

#### DynamoDB Verification:
1. Go to AWS DynamoDB Console
2. Open `BooksMetadata` table
3. Click "Explore table items"
4. Check any book item
5. Verify `coverImage` field contains S3 URL

### Step 6: Test in Mobile App

The mobile app is already updated to display icons:

1. **AllBooks.tsx** - Shows icons in grid view
2. **BooksScreen.tsx** - Shows icons in list view

To test:
```bash
# In the project root
npm start
# or
npx expo start
```

Open the app and navigate to the books screen. You should see unique icons for each book.

## Book Icon Mapping

Here are all 36 books with their icons:

| PDF Filename | Hindi Name | Theme | Colors |
|-------------|-----------|-------|--------|
| Aatmbodh-.pdf | आत्मबोध | Om & Lotus | Orange/Gold |
| AatmbodhMala.pdf | आत्मबोध माला | Mala Beads | Brown/Tan |
| Adhyatma ka khel.pdf | अध्यात्म का खेल | Yantra | Blue/Sky |
| Advaita_Bhakti.pdf | अद्वैत भक्ति | Lotus Flame | Pink/Rose |
| ... | ... | ... | ... |

(See `book-icons/book-icon-mapping.json` for complete list)

## Troubleshooting

### Issue: "Access Denied" error when uploading
**Solution**: Check AWS credentials and IAM permissions in `.env` file

### Issue: Icons not showing in app
**Solution**:
1. Verify S3 bucket policy allows public read
2. Check that `coverImage` field is updated in DynamoDB
3. Ensure URLs are accessible in browser

### Issue: Some books don't match icons
**Solution**: Check `book-icon-mapping.json` - the script matches by filename

### Issue: Icons appear broken in app
**Solution**: SVG might not be supported. Consider converting to PNG:
```bash
# Install converter
npm install -g svgexport

# Convert all icons
cd book-icons
for file in *.svg; do
  svgexport "$file" "${file%.svg}.png" 400:600
done
```

Then update upload script to use PNG files.

## Future Enhancements

1. **Auto-generate icons on book upload**: Integrate icon generation into the book upload flow
2. **Custom icon editor**: Allow admins to customize book icons
3. **Multiple icon styles**: Provide different spiritual art styles to choose from
4. **Icon caching**: Implement CDN caching for faster load times
5. **Fallback images**: Add graceful fallbacks if icons fail to load

## File Structure

```
AWS_Backend/
├── generateBookIcons.js        # Icon generator script
├── uploadBookIcons.js          # S3 upload & DB update script
├── book-icons/                 # Generated icons directory
│   ├── आत्मबोध.svg
│   ├── आत्मबोध माला.svg
│   ├── ...
│   └── book-icon-mapping.json  # Mapping file
├── services/
│   ├── s3Service.js           # Updated with uploadIcon()
│   └── dynamoService.js       # Updated with coverImage support
└── BOOK_ICONS_SETUP.md        # This file
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify AWS credentials and permissions
3. Check S3 bucket policy
4. Review DynamoDB items for coverImage field

---

**Created**: February 2, 2026
**Icons Generated**: 36 unique spiritual book icons with Hindi names
