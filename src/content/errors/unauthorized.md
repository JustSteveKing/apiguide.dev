---
title: Unauthorized
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['expired-authentication-token', 'insufficient-scope']
publishedDate: 2026-07-07
---

## When to use it

Use 401 Unauthorized when the request lacks valid authentication credentials. This applies when the client sends no authorization headers/cookies, or when the credentials provided are completely invalid, malformed, or unrecognized by the system.

A 401 response requires that the server must include a `WWW-Authenticate` header specifying the authentication scheme (e.g. `WWW-Authenticate: Bearer realm="api"`).

## When not to use it

Do not use 401 if the client has successfully authenticated, but lacks the necessary permissions or scope to access the resource (use `insufficient-scope` / 403 instead). Do not use this if the token is known but expired (use the more specific `expired-authentication-token` error).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "The API key provided is invalid or has been revoked.",
  "instance": "/v1/leads"
}
```

Include a header to specify the authentication scheme:

```
WWW-Authenticate: Bearer realm="api"
```
