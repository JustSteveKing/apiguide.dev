---
title: Invalid Credentials
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['unauthorized', 'token-revoked', 'mfa-required', 'rate-limit-exceeded']
publishedDate: 2026-10-17
---

## When to use it

Use [`401 Unauthorized`](/status-codes/401) with an Invalid Credentials error when the client presents a credential pair to authenticate and the pair does not check out: a username and password that do not match, an API key ID with the wrong secret, or HTTP Basic credentials for an account that does not exist. The request was well formed and the client clearly tried to authenticate; the credentials were simply wrong.

This is narrower than `unauthorized`. That type covers any request without valid authentication, including no credentials at all. This one tells the client it did send credentials and they were rejected, so retrying with the same values will never work and the user needs to re-enter them.

Return the same response whichever half of the pair was wrong. "No such user" and "wrong password" are different failures on your side, but telling the client which one occurred lets an attacker enumerate valid usernames or key IDs. Keep the response time the same too, by running the password hash check even when the account does not exist.

RFC 9110 requires a 401 to carry a [`WWW-Authenticate`](/headers/www-authenticate) challenge for the scheme the client should use, such as `Basic realm="api"`.

## When not to use it

Do not use it at an OAuth 2.0 token endpoint. RFC 6749 fixes that error format: wrong resource owner credentials are `invalid_grant` with 400, and failed client authentication is `invalid_client`, which must be 401 when the client authenticated with the [`Authorization`](/headers/authorization) header. Clients built against OAuth libraries expect that shape.

Do not use it for bearer tokens on ordinary API requests. A token that has expired is `expired-authentication-token`, one that was revoked is `token-revoked`, and one you do not recognize at all is `unauthorized`.

Do not use it when the credentials were right but a second factor is still needed. That is `mfa-required`. Reporting correct credentials as invalid sends the user into a password reset they do not need.

Do not use it when the account behind valid credentials is suspended. That is `account-frozen` (403). Whether you reveal suspension before checking credentials is a security decision: checking credentials first means only the account holder learns the account is frozen.

## Example response

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
WWW-Authenticate: Basic realm="api"

{
  "type": "https://apiguide.dev/errors/invalid-credentials",
  "title": "Invalid Credentials",
  "status": 401,
  "detail": "The username or password is incorrect.",
  "instance": "/v1/sessions"
}
```

Limit failed attempts per account and per source, and answer the excess with `rate-limit-exceeded` (429). Without a limit, an endpoint that returns this type is an online password-guessing service.
