---
title: Insufficient Scope
statusCode: 403
statusText: Forbidden
category: client-error
relatedCodes: ['unauthorized', 'expired-authentication-token']
publishedDate: 2026-07-07
---

## When to use it

Use 403 with an Insufficient Scope error when the client's credentials (like an API token or OAuth access token) are valid and authenticated, but the token lacks the specific permissions or scopes needed to access the requested resource or perform the HTTP action.

A common example is a token generated with a `read` scope attempting to perform a `POST`, `PUT`, or `DELETE` request.

## When not to use it

Do not use this if the client is unauthenticated (use `unauthorized` or 401). Do not use this if the token is expired (use `expired-authentication-token` / 401).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/insufficient-scope",
  "title": "Insufficient Scope",
  "status": 403,
  "detail": "The token provided lacks the required 'leads:write' scope.",
  "instance": "/v1/leads"
}
```
