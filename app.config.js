// Expo dynamic config.
//
// Reads the base config from app.json and applies overrides based on the
// APP_VARIANT environment variable so a single repo can produce side-by-side
// installable builds.
//
//   APP_VARIANT (unset)   → production build (matches Play Store release)
//   APP_VARIANT=phase2dev → parallel dev build with a different package id,
//                            display name, and API URL. Install side-by-side
//                            with production app without conflict.
//
// IMPORTANT: app.json remains the source of truth for the prod build. This
// file only adds overrides on top of it — never deletes anything.

const base = require('./app.json').expo;

const variant = process.env.APP_VARIANT || 'production';

const overrides = {
  production: {
    // No overrides — uses app.json verbatim. Keeps Play Store build stable.
    extra: {
      ...base.extra,
      appVariant: 'production',
      apiUrl: 'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev',
    },
  },
  phase2dev: {
    name: 'Satguru Panth Dev',
    ios: {
      ...base.ios,
      bundleIdentifier: 'com.satgurupanth.phase2dev',
    },
    android: {
      ...base.android,
      package: 'com.satgurupanth.phase2dev',
    },
    extra: {
      ...base.extra,
      appVariant: 'phase2dev',
      // Resolved on 2026-05-15 by `serverless deploy --stage phase2dev`.
      // Override with PHASE2DEV_API_URL env var for transient testing if needed.
      apiUrl:
        process.env.PHASE2DEV_API_URL ||
        'https://j2bef7ci54.execute-api.us-east-1.amazonaws.com/phase2dev',
    },
  },
};

const variantOverrides = overrides[variant] || overrides.production;

module.exports = {
  expo: {
    ...base,
    ...variantOverrides,
    ios: { ...base.ios, ...(variantOverrides.ios || {}) },
    android: { ...base.android, ...(variantOverrides.android || {}) },
    extra: variantOverrides.extra,
  },
};
