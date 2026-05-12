// Custom Lambda authorizer for API Gateway. Replaces the Cognito Authorizer.
// Validates our HS256 JWTs (issued by functions/auth/google.js) and exposes
// the user identity on event.requestContext.authorizer for downstream handlers.

const { verifyToken } = require('../../services/auth');

function deny(reason) {
  // Throwing a string with this exact message makes API Gateway return 401.
  const err = new Error('Unauthorized');
  err.reason = reason;
  throw err;
}

function allowPolicy(principalId, methodArn, contextPayload) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          // Allow the whole API for this token (avoids re-invoking the
          // authorizer for every endpoint within the cache TTL window).
          Resource: methodArn.split('/').slice(0, 2).join('/') + '/*/*',
        },
      ],
    },
    context: contextPayload,
  };
}

exports.handler = async (event) => {
  const rawHeader = event.authorizationToken || event.headers?.Authorization || event.headers?.authorization || '';
  const match = /^Bearer\s+(\S+)$/i.exec(rawHeader);
  if (!match) deny('Missing Bearer token');

  let payload;
  try {
    payload = verifyToken(match[1]);
  } catch (err) {
    deny(`Token verify failed: ${err.message}`);
  }

  if (!payload || !payload.sub) deny('Token missing sub claim');

  return allowPolicy(payload.sub, event.methodArn, {
    userId: String(payload.sub),
    email: payload.email || '',
    name: payload.name || '',
  });
};
