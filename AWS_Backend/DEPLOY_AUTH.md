# Deploying the Auth System

This is the step-by-step you'll run **once** to provision Cognito + the new auth
endpoints in your AWS account.

## 1. Prerequisites

You probably already have these from the existing deploy:

- AWS CLI configured with admin-ish creds for the same account that owns
  `book-reader-pdfs` and `BooksMetadata`.
- Serverless Framework installed (`npm i -g serverless`).
- Node 18+.

## 2. Verify a sender in SES

Cognito's default no-reply email has a 50/day limit and unreliable deliverability.
For real users, verify a sender via SES.

```bash
# Easiest: verify a single email address (good for testing)
aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1

# Production: verify the whole domain (one-time DNS work)
aws ses verify-domain-identity --domain yourdomain.com --region us-east-1
```

Open the inbox for `noreply@yourdomain.com` and click the verify link.
Then export it for serverless deploy:

```bash
export SES_FROM_EMAIL="noreply@yourdomain.com"
```

> **SES sandbox**: brand-new SES accounts can only send *to* verified addresses.
> Request production access in the SES console once you're ready for real users.

## 3. Deploy

```bash
cd AWS_Backend
serverless deploy
```

This creates:

- `book-reader-users-dev` Cognito User Pool
- `book-reader-app-dev` Cognito User Pool Client
- 4 Lambda triggers (PreSignUp + 3 custom-auth handlers)
- 5 new endpoints: `/api/auth/signup`, `/signin`, `/verify`, `/api/me`,
  `/api/me/liked-books`
- Updated `/api/books/{bookId}/like` (now requires JWT)

When it finishes, copy the **Outputs** block from the deploy log. You'll see:

```
UserPoolId: us-east-1_xxxxxxxxx
UserPoolClientId: 1234567890abcdefghijk
```

## 4. (One-time) plug SES env var into the createAuthChallenge Lambda

The first deploy will succeed but `createAuthChallenge` falls back to a
placeholder sender if `SES_FROM_EMAIL` wasn't set. Re-deploy with it:

```bash
SES_FROM_EMAIL="noreply@yourdomain.com" serverless deploy --function createAuthChallenge
```

Or set it permanently in `serverless.yml` under `provider.environment` if you
prefer not to keep typing it.

## 5. Update the app config

The app already talks to the right API Gateway URL (it hasn't changed). No
client config update is needed — the Cognito IDs live server-side only.

Rebuild the APK once you've deployed:

```bash
cd .. # back to project root
./build-apk.sh                   # debug
# or for release:
cd android && ./gradlew assembleRelease
```

## 6. Try it

1. Launch the APK
2. Enter your verified email → "Create account" → name + phone → OTP
3. Check email → enter 6-digit code → land in the Library
4. Like a book → reopen app → like persists, and double-tap doesn't double-count

## 7. Migrating existing anonymous likes (optional)

The existing `BooksMetadata` rows have a `likeCount` integer. The new schema
keeps this counter (denormalised for fast list reads) but also writes a
`LIKE#userId#bookId` row per real like. The two go out of sync gracefully —
the counter is always authoritative for *display*, the per-user rows are
authoritative for *who liked what*.

You don't have to migrate anything. Existing counts stay; new likes flow into
both. If you want to reset counters to 0 so the rank is determined purely by
authenticated likes, run:

```bash
node -e '
  const AWS = require("aws-sdk");
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  (async () => {
    const r = await dynamodb.scan({
      TableName: "BooksMetadata",
      FilterExpression: "entityType = :t",
      ExpressionAttributeValues: { ":t": "BOOK" },
      ProjectionExpression: "BookID",
    }).promise();
    for (const it of r.Items) {
      await dynamodb.update({
        TableName: "BooksMetadata",
        Key: { BookID: it.BookID },
        UpdateExpression: "SET likeCount = :zero",
        ExpressionAttributeValues: { ":zero": 0 },
      }).promise();
      console.log("reset", it.BookID);
    }
  })();
'
```

## 8. Cost notes

- Cognito: free up to 50K monthly active users
- SES outside the free tier: $0.10 per 1,000 emails
- DynamoDB on-demand: pennies at this scale
- Lambda: well within the free tier given typical traffic
