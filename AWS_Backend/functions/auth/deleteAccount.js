// DELETE /api/me
// Requires Authorization: Bearer <our-jwt>.
//
// Wipes the user's profile row and all per-user LIKE rows. This is the
// endpoint surfaced to users via the in-app "Delete account" button and the
// public account-deletion URL declared in Play Console's Data safety form.

const { deleteUserData } = require('../../services/userService');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.userId;
    if (!userId) return json(401, { error: 'Unauthenticated' });

    const result = await deleteUserData(userId);
    return json(200, { deleted: true, ...result });
  } catch (err) {
    console.error('deleteAccount error:', err);
    return json(500, { error: 'Could not delete account' });
  }
};
