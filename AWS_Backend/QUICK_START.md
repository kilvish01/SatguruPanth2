# Quick Start: Upload Book Icons

This guide will help you quickly upload the 36 unique book icons to S3 and update your database.

## Prerequisites

You need:
- AWS Account with access to S3 and DynamoDB
- AWS credentials (Access Key ID and Secret Access Key)

## Step 1: Configure AWS Credentials (2 minutes)

Edit the `.env` file in the `AWS_Backend` directory:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET=book-reader-pdfs
DYNAMO_TABLE=BooksMetadata
```

Replace `AKIAXXXXXXXXXXXXXXXX` and the secret key with your actual AWS credentials.

## Step 2: Update S3 Bucket Policy (3 minutes)

1. Go to AWS Console → S3 → book-reader-pdfs bucket
2. Click "Permissions" tab
3. Scroll to "Bucket Policy"
4. Click "Edit" and add this policy:

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
    },
    {
      "Sid": "ExistingPDFAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::book-reader-pdfs/pdfs/*"
    }
  ]
}
```

5. Click "Save changes"

## Step 3: Verify Setup (1 minute)

```bash
cd AWS_Backend
node verifyIconSetup.js
```

You should see all checkmarks (✓). If you see errors (✗), fix them before proceeding.

## Step 4: Upload Icons (2-3 minutes)

```bash
node uploadBookIcons.js
```

This will:
- Upload 36 icons to S3 (book-icons folder)
- Update all 36 books in DynamoDB with icon URLs
- Show progress for each book

Expected output:
```
Starting book icon upload and database update...

[1/36] Uploading: आत्मबोध...
  ✓ Uploaded to S3: https://book-reader-pdfs.s3.amazonaws.com/book-icons/आत्मबोध.svg
  ✓ Updated DB for book: Aatmbodh

[2/36] Uploading: आत्मबोध माला...
  ✓ Uploaded to S3: ...
...

✓ Successful: 36
✗ Errors: 0
```

## Step 5: Verify Upload (2 minutes)

### Check S3:
1. Go to AWS Console → S3 → book-reader-pdfs
2. Open `book-icons/` folder
3. You should see 36 SVG files with Hindi names

### Check DynamoDB:
1. Go to AWS Console → DynamoDB → BooksMetadata table
2. Click "Explore table items"
3. Pick any book and verify it has a `coverImage` field with an S3 URL

### Test an icon URL:
Copy any icon URL from DynamoDB and paste it in your browser. The icon should display.

## Step 6: Test in Mobile App (3 minutes)

```bash
# In the project root directory
npm start
# or
npx expo start
```

1. Open the app in your emulator/device
2. Navigate to the Books screen
3. You should see unique icons for each book

## Troubleshooting

### Problem: "Access Denied" error
**Solution**: Check AWS credentials in `.env` file

### Problem: Icons not showing in app
**Solutions**:
1. Verify S3 bucket policy is set correctly
2. Check that URLs are accessible in browser
3. Clear app cache and restart

### Problem: Some books missing icons
**Solution**: Check `book-icon-mapping.json` - it maps PDFs to icons by filename

## Summary of What Happens

```
Before:                          After:
┌──────────────┐                ┌──────────────┐
│              │                │  [Icon: ॐ]  │
│  No Icon     │  ────────→     │              │
│              │                │  आत्मबोध     │
│  Title Only  │                │  Book Title  │
└──────────────┘                └──────────────┘
```

## What You Get

✓ 36 unique spiritual icons
✓ Hindi names on all icons
✓ Different colors for each book
✓ Icons automatically displayed in app
✓ Icons cached for fast loading

## Total Time Required

- Setup: ~10-15 minutes (one-time)
- Upload: ~2-3 minutes
- Testing: ~3-5 minutes

**Total: About 15-20 minutes**

## Files Created

```
AWS_Backend/
├── book-icons/              # 36 SVG icons
│   ├── आत्मबोध.svg
│   ├── आत्मबोध माला.svg
│   └── ... (34 more)
└── scripts/
    ├── generateBookIcons.js
    ├── uploadBookIcons.js
    └── verifyIconSetup.js
```

## Need Help?

See detailed documentation:
- **[BOOK_ICONS_SETUP.md](BOOK_ICONS_SETUP.md)** - Complete setup guide
- **[BOOK_ICONS_IMPLEMENTATION_SUMMARY.md](../BOOK_ICONS_IMPLEMENTATION_SUMMARY.md)** - Technical details

---

**That's it!** Follow these steps and your books will have beautiful, unique icons. 🎨
