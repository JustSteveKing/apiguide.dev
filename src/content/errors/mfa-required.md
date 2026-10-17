---
title: MFA Required
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['insufficient-scope', 'invalid-credentials', 'forbidden']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`401 Unauthorized`](/status-codes/401) with an MFA Required error when the caller is authenticated, but not strongly or recently enough for this operation, and must complete multi-factor authentication before it can proceed. Common triggers are a sensitive action, such as changing payout details, deleting an organization or creating an API key, attempted on a session that signed in with a password alone, or on one whose last MFA check is too old for your policy.

Use 401, not 403. The caller can fix this by authenticating again, more strongly, and that is what 401 means: the request lacks credentials that are sufficient for the target resource. 403 means authenticating again will not help, which is the opposite of what you want the client to do.

For OAuth 2.0 resource servers this is step-up authentication, standardized in RFC 9470. It defines the `insufficient_user_authentication` error code for the Bearer [`WWW-Authenticate`](/headers/www-authenticate) challenge, meaning the authentication event behind the access token does not meet the resource's requirements, and its examples use 401. Two parameters say what is needed: `acr_values`, a space-separated list of acceptable authentication context class references, and `max_age`, the number of seconds allowed since the user last actively authenticated. The client takes those to the authorization server, gets a new token, and retries.

## When not to use it

Do not use it when the user has not enrolled a second factor and your policy requires one. Re-authenticating cannot help until they enroll, so that is `forbidden` (403), with a `detail` pointing at enrollment.

Do not use it when the token lacks an OAuth scope. That is `insufficient-scope` (403). RFC 9470 notes that a challenge can carry `scope` alongside `acr_values` when both are missing, but a scope problem on its own is not an authentication-strength problem.

Do not use it during an interactive login flow to say "now enter your code". That is a step in your sign-in protocol, not an error on an API call, and modeling it as one makes every client treat a normal login as a failure.

Do not use it in place of `invalid-credentials`. If the password was wrong, say so; asking for a second factor after a wrong password tells an attacker the password was right.

## Example response

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
WWW-Authenticate: Bearer error="insufficient_user_authentication", acr_values="urn:example:acr:mfa", max_age="300"

{
  "type": "https://apiguide.dev/errors/mfa-required",
  "title": "MFA Required",
  "status": 401,
  "detail": "Changing payout details requires multi-factor authentication within the last 5 minutes. Re-authenticate with a second factor and retry.",
  "instance": "/v1/payout-methods",
  "acrValues": ["urn:example:acr:mfa"],
  "maxAge": 300
}
```

`acr_values` are defined by your authorization server, not by RFC 9470, so publish the ones you use. Put the requirement in the problem body as well as the challenge, because many HTTP clients make response headers awkward to reach and the body is what ends up in logs.
