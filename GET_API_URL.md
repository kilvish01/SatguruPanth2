# How to Add Your API Gateway URL

## Option 1: Get URL from AWS Console (Easiest)

1. Go to AWS Console: https://console.aws.amazon.com/
2. Navigate to **API Gateway** service
3. Find your API: **book-reader-backend-dev** or **dev-book-reader-backend**
4. Click on **Stages** in the left sidebar
5. Click on **dev** stage
6. Copy the **Invoke URL** at the top (e.g., `https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev`)
7. Paste it in `src/config/api.config.ts` replacing the placeholder

## Option 2: Get URL from CloudFormation

1. Go to AWS Console: https://console.aws.amazon.com/cloudformation/
2. Find stack: **book-reader-backend-dev**
3. Click on **Outputs** tab
4. Copy the **ServiceEndpoint** value
5. Paste it in `src/config/api.config.ts`

## Option 3: Use AWS CLI (if installed)

```bash
aws cloudformation describe-stacks \
  --stack-name book-reader-backend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ServiceEndpoint`].OutputValue' \
  --output text
```

## After Getting the URL

Update `src/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  AWS_API_URL: 'https://YOUR_ACTUAL_API_ID.execute-api.us-east-1.amazonaws.com/dev',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};
```

Then start your app:
```bash
npx expo start
```
