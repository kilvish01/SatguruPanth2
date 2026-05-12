// Best-effort JWT decoder for *public* endpoints that want to optionally
// know who the caller is when a Bearer token is present (e.g. annotating
// each book with `likedByMe`). Protected endpoints get a verified identity
// via the custom Lambda authorizer at functions/auth/authorizer.js — do NOT
// use this decoder for anything load-bearing.

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function tryDecodeUserId(event) {
  const headers = event.headers || {};
  const auth = headers.Authorization || headers.authorization;
  if (!auth) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(auth);
  if (!match) return null;
  const payload = decodeJwtPayload(match[1]);
  if (!payload || !payload.sub) return null;
  return payload.sub;
}

module.exports = { tryDecodeUserId };
