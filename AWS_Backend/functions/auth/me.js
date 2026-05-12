// GET /api/me
// Returns the current user's profile. Identity comes from the custom Lambda
// authorizer (functions/auth/authorizer.js), which already verified the JWT
// and stamped userId/email/name onto the request context.

const { getUser } = require('../../services/userService');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const ctx = event.requestContext?.authorizer || {};
  const userId = ctx.userId;
  if (!userId) return json(401, { error: 'Unauthenticated' });

  const user = await getUser(userId);
  if (!user) {
    // Edge case: token still valid but the user record was deleted. Surface
    // as unauthenticated so the app forces a re-sign-in.
    return json(401, { error: 'Account no longer exists' });
  }

  return json(200, {
    id: user.userId,
    email: user.email,
    name: user.name || null,
    picture: user.picture || null,
  });
};
