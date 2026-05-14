# Phase 2 Dev Environment — Setup Runbook

This document is the exact set of commands to provision the `phase2dev` AWS
environment that runs alongside production. Production deploys are untouched.

> All commands run from the `AWS_Backend/` directory unless noted.

---

## 0. Before you start

- AWS credentials configured locally (`aws sts get-caller-identity` works).
- The IAM user `Amish_BookStore` is **no longer** flagged
  `AWSCompromisedKeyQuarantineV3`. (Confirmed by user 2026-05-15.)
- `serverless` CLI installed globally or use `npx serverless …`.
- `.env` file present in `AWS_Backend/` with `JWT_SECRET` and
  `GOOGLE_WEB_CLIENT_ID` (same values used for prod are fine for dev).

---

## 1. Deploy the phase2dev backend stack

```bash
cd AWS_Backend
npx serverless deploy --stage phase2dev
```

What this creates (all brand-new, prod untouched):

| Resource type | Name |
|---|---|
| DynamoDB table | `BooksMetadata-phase2dev` |
| DynamoDB table | `BookContent-phase2dev` |
| DynamoDB table | `ReadingProgress-phase2dev` (+ GSI `userId-lastReadAt-index`) |
| S3 bucket | `book-reader-pdfs-phase2dev` |
| S3 bucket | `book-reader-content-phase2dev` |
| API Gateway | new REST API on stage `phase2dev` |
| Lambdas | all current functions, suffixed with `-phase2dev` |

At the end, Serverless prints the new API URL — looks like:

```
https://<NEW-ID>.execute-api.us-east-1.amazonaws.com/phase2dev
```

**Copy this URL. You will need it in step 3.**

---

## 2. Seed prod data into phase2dev

```bash
# Dry-run first — prints what would be copied, writes nothing
node scripts/seedDev.js

# When you're satisfied:
node scripts/seedDev.js --apply
```

This copies:
- All books from `BooksMetadata` → `BooksMetadata-phase2dev`
- All PDFs from `book-reader-pdfs` → `book-reader-pdfs-phase2dev`

`ReadingProgress-phase2dev` and `BookContent-phase2dev` start empty — they get
populated in milestones M1 and M3.

---

## 3. Plug the new API URL into the dev app

Edit `app.config.js` at the repo root and replace the `PLACEHOLDER` URL inside
the `phase2dev` overrides block with the URL Serverless printed in step 1.

Alternatively, build the dev APK with the URL as an env var:

```bash
PHASE2DEV_API_URL=https://<NEW-ID>.execute-api.us-east-1.amazonaws.com/phase2dev \
APP_VARIANT=phase2dev \
npx eas build --profile phase2dev --platform android
```

---

## 4. Smoke-test the dev backend

```bash
# Should return JSON with the seeded books
curl https://<NEW-ID>.execute-api.us-east-1.amazonaws.com/phase2dev/api/books/all
```

If you see your books, the dev environment is alive.

---

## 5. Day-to-day usage

- **Deploy backend changes to dev only:**
  `npx serverless deploy --stage phase2dev`

- **Deploy a single function to dev only:**
  `npx serverless deploy function -f getBook --stage phase2dev`

- **Tail dev logs:**
  `npx serverless logs -f getBook --stage phase2dev -t`

- **Deploy to prod (when something is ready to ship):**
  `npx serverless deploy` — defaults to stage `dev` which IS the production
  stage today. Prod table/bucket names are preserved via `custom.tableName.dev`
  and `custom.bucketName.dev` in `serverless.yml`.

---

## 6. Teardown (if you ever want to nuke phase2dev)

```bash
# Empty the buckets first (CloudFormation won't delete non-empty buckets)
aws s3 rm s3://book-reader-pdfs-phase2dev --recursive
aws s3 rm s3://book-reader-content-phase2dev --recursive

# Remove the stack — also removes the DynamoDB tables (DeletionPolicy: Retain
# means they survive the remove; delete them manually if desired)
npx serverless remove --stage phase2dev
```
