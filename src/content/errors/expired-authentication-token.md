---
title: Expired Authentication Token
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['unauthorized', 'insufficient-scope']
publishedDate: 2026-02-11
---

## When to use it

Use 401 with an expired authentication token error when the client presents a token (such as a JWT, OAuth token, or API token) that is structurally valid and was previously recognized by the server, but has since passed its expiration timestamp.

This allows the client to detect that their session has timed out and programmatically attempt to request a new token using a refresh token, rather than treating the failure as a permanent lack of credentials.

## When not to use it

Do not use this if the client sent no token at all, or if the token is completely malformed or unsigned. In those cases, use a generic `unauthorized` error. Also, do not use this if the token is valid but the user lacks the necessary permissions to access the resource; use `insufficient-scope` (403) instead.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/expired-authentication-token",
  "title": "Expired Authentication Token",
  "status": 401,
  "detail": "The access token expired at 2026-07-07T10:00:00Z. Please request a new token.",
  "instance": "/v1/leads"
}
```

Include a `WWW-Authenticate` header describing exactly why the token was rejected, per RFC 6750:

```
WWW-Authenticate: Bearer error="invalid_token", error_description="The access token expired"
```
