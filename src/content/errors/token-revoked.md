---
title: Token Revoked
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['expired-authentication-token', 'unauthorized', 'invalid-credentials']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`401 Unauthorized`](/status-codes/401) with a Token Revoked error when the client presents an access token or API key that was valid, has not expired, and has since been revoked: the user signed out, an admin disabled the integration, the key was rotated after a leak, or the authorization server revoked the grant it belonged to.

The distinction from expiry is what the client should do next. An expired access token is routine, and the client refreshes it silently. A revoked one usually means the delegation behind it is gone. RFC 7009 says revoking a refresh token SHOULD also invalidate the access tokens issued under the same grant, so a client that tries to refresh will often fail as well. Telling it the token was revoked lets it skip the doomed refresh and send the user back through sign-in, or alert an operator that a key was rotated.

RFC 6750's `invalid_token` error code covers this case explicitly, defined as an access token that is "expired, revoked, malformed, or invalid for other reasons". Send it in the [`WWW-Authenticate`](/headers/www-authenticate) challenge that RFC 9110 requires on every 401, and use the problem type to say which of those it was. The [token lifecycle guide](/guides/token-lifecycle) covers revocation and why it is harder for JWTs.

## When not to use it

Do not use it unless you actually know the token was revoked. A resource server that validates JWTs locally cannot tell a revoked token from a valid one without a denylist, and an introspection response under RFC 7662 reports `"active": false` for revoked, expired and unknown tokens alike. If all you know is that the token is not valid, use `unauthorized`.

Do not use it for an expired token. That is `expired-authentication-token`, and the client should refresh rather than re-authenticate.

Do not use it when the token is valid and the account is suspended. The token was not revoked; the account is blocked, which is `account-frozen` (403).

Do not use it if confirming that a token once existed would leak something. For a leaked API key being probed by a third party, a generic `unauthorized` gives the prober less. Reserve this type for cases where the caller is plausibly the token's legitimate holder, such as a session token sent from the client it was issued to.

## Example response

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
WWW-Authenticate: Bearer error="invalid_token", error_description="The access token has been revoked"

{
  "type": "https://apiguide.dev/errors/token-revoked",
  "title": "Token Revoked",
  "status": 401,
  "detail": "This access token was revoked on 2026-10-16T18:04:00Z. Sign in again to obtain a new token.",
  "instance": "/v1/projects"
}
```

Leave out who revoked the token and why. The legitimate user can find that in your dashboard or audit log, and anyone else holding the token should learn nothing beyond the fact that it no longer works.
