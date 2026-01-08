// AWS API Configuration
// Replace this with your actual AWS API Gateway URL after deployment
// You can find it by running: cd AWS_Backend && serverless info
// Or in AWS Console: API Gateway -> Your API -> Stages -> dev

export const API_CONFIG = {
  AWS_API_URL: 'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};
