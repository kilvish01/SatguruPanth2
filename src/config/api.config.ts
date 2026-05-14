// AWS API Configuration
//
// The API URL is now driven by the active app variant (production vs
// phase2dev) via src/config/env.ts. Variants are selected at build time
// through app.config.js + the APP_VARIANT env var. See eas.json for the
// build profiles.
//
// To run against phase2dev locally:
//   APP_VARIANT=phase2dev PHASE2DEV_API_URL=https://<id>.execute-api...
//   npx expo start --clear

import { env } from './env';

export const API_CONFIG = {
  AWS_API_URL: env.apiUrl,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
