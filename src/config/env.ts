// Runtime environment configuration.
//
// Resolves the active app variant ("production" vs "phase2dev") and the
// matching API URL by reading values injected into `expo.extra` via
// app.config.js at build time.
//
// Add new per-variant runtime settings here so feature code stays variant-
// agnostic — components just read from `env`, never from process.env or
// hard-coded URLs.

import Constants from 'expo-constants';

type AppVariant = 'production' | 'phase2dev';

interface ExtraConfig {
  appVariant?: AppVariant;
  apiUrl?: string;
}

const extra: ExtraConfig =
  (Constants.expoConfig?.extra as ExtraConfig | undefined) ??
  ((Constants.manifest as { extra?: ExtraConfig } | null)?.extra as ExtraConfig | undefined) ??
  {};

const PROD_API_URL = 'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev';

const appVariant: AppVariant = extra.appVariant ?? 'production';
const apiUrl = extra.apiUrl ?? PROD_API_URL;

export const env = {
  appVariant,
  apiUrl,
  isProduction: appVariant === 'production',
  isPhase2Dev: appVariant === 'phase2dev',
} as const;

export type Env = typeof env;
