// Google OAuth client IDs from Google Cloud Console → APIs & Services → Credentials.
//
// WEB_CLIENT_ID is the *audience* the backend validates against — it must be
// the OAuth client of type "Web application" in your Google Cloud project.
// The native SDK uses this as `webClientId` and the backend Lambda compares
// it against the `aud` claim in the Google ID token.
//
// ANDROID_CLIENT_ID is informational on the JS side (the Android SDK reads
// the package + SHA-1 OAuth client implicitly via the platform). Filled in
// here for documentation/parity with iOS.

export const GOOGLE_SIGN_IN_CONFIG = {
  WEB_CLIENT_ID: '1078294778614-n4l0pn01740sgfif9mcrvc9ovvo4e207.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: '1078294778614-t69bj2jugjk56ia0712v3pmqgjteehhm.apps.googleusercontent.com',
  IOS_CLIENT_ID: '',
};
