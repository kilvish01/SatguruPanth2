// Verifies a Google ID token (the JWT the @react-native-google-signin SDK
// returns from a successful native sign-in) against Google's public keys.
//
// Returns the verified payload on success, throws on failure. The caller is
// responsible for upserting the user record + issuing our own JWT.

const { OAuth2Client } = require('google-auth-library');

const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID;

// Build the audience list once. The native SDK returns a token whose `aud`
// claim matches the OAuth client that requested it (Android or iOS), but the
// `serverClientId` flow makes the Web client ID the audience instead. We
// accept any of the three so the same backend works across all sign-in paths.
function audiences() {
  return [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(Boolean);
}

const client = new OAuth2Client();

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('idToken is required');
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('GOOGLE_WEB_CLIENT_ID env var is not set');
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: audiences(),
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new Error('Google token payload is empty');
  }
  if (!payload.email_verified) {
    throw new Error('Google account email is not verified');
  }
  return payload;
}

module.exports = { verifyGoogleIdToken };
