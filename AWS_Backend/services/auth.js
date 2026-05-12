// JWT helpers — issue & verify our own tokens. Replaces the Cognito-issued
// tokens we used before the Google Sign-In migration.
//
// Tokens are HS256 with a single shared secret (JWT_SECRET env var).
// Lifetime: 30 days. The mobile app stores the token in secure storage and
// sends it as `Authorization: Bearer <token>` on every authenticated call.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function assertSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET env var is not set');
  }
}

function issueToken({ userId, email, name }) {
  assertSecret();
  return jwt.sign(
    { sub: userId, email, name: name || '' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_TTL_SECONDS }
  );
}

function verifyToken(token) {
  assertSecret();
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { issueToken, verifyToken, JWT_TTL_SECONDS };
