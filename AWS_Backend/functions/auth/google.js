// POST /api/auth/google
// Body: { idToken }
//
// Exchanges a Google ID token (from the @react-native-google-signin SDK) for
// our own JWT. Creates the user row in DynamoDB on first sign-in, updates
// lastSignInAt on subsequent calls.

const { verifyGoogleIdToken } = require('../../services/googleAuth');
const { upsertUserFromGoogle } = require('../../services/userService');
const { issueToken, JWT_TTL_SECONDS } = require('../../services/auth');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const idToken = body.idToken;
    if (!idToken) return json(400, { error: 'idToken is required' });

    let payload;
    try {
      payload = await verifyGoogleIdToken(idToken);
    } catch (err) {
      console.error('Google token verify failed:', err.message);
      return json(401, { error: 'Invalid Google token' });
    }

    const user = await upsertUserFromGoogle(payload);
    const token = issueToken({ userId: user.userId, email: user.email, name: user.name });

    return json(200, {
      token,
      expiresIn: JWT_TTL_SECONDS,
      user: {
        id: user.userId,
        email: user.email,
        name: user.name || null,
        picture: user.picture || null,
      },
    });
  } catch (err) {
    console.error('google auth handler error:', err);
    return json(500, { error: 'Internal error' });
  }
};
