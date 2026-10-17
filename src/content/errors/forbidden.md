---
title: Forbidden
statusCode: 403
statusText: Forbidden
category: client-error
relatedCodes: ['insufficient-scope', 'unauthorized', 'account-frozen', 'resource-not-found']
publishedDate: 2026-10-14
updatedDate: 2026-10-14
---

## When to use it

Use 403 Forbidden when the server knows who the caller is, the credentials are valid, and your authorization rules still refuse this action. RFC 9110 defines 403 as a server that "understood the request but refuses to fulfill it", and states that when credentials were provided, the server "considers them insufficient to grant access".

This is the general authorization-denied case, decided by your own policy rather than by the token: a member trying to delete a project only an owner can delete, a user editing another user's profile, a role without access to billing data, or a request from outside an IP allowlist. RFC 9110 notes that a request "might be forbidden for reasons unrelated to the credentials", which covers the allowlist case.

RFC 9110 also says the client "SHOULD NOT automatically repeat the request with the same credentials". Tell the client what it lacks, such as the role or relationship the action needs, so a human can request access. A bare 403 with no reason leaves them guessing whether to ask an admin, switch accounts or give up.

## When not to use it

Do not use it when the caller is not authenticated, or the credentials are missing, malformed or revoked. That is `unauthorized` (401), and an expired token is `expired-authentication-token`. 401 means "authenticate and try again"; 403 means authenticating again will not help.

Do not use it when the refusal comes from the OAuth scopes on the access token rather than from your own permission model. That is `insufficient-scope`, also a 403, which carries the RFC 6750 `WWW-Authenticate` challenge so a client can request a token with the right scope. A user who is an owner but holds a `read`-only token gets `insufficient-scope`; a user with a full-scope token who is not an owner gets this type.

Do not use it when the whole account is suspended and every request fails regardless of permissions. That is `account-frozen`.

Do not use it when the caller should not learn that the resource exists at all. RFC 9110 allows an origin server that wants to hide the existence of a forbidden resource to respond with 404 instead, so use `resource-not-found`. The rule that works: if the caller cannot see the resource at all (another tenant's order ID), return 404; if they can read it but cannot perform this action on it, return 403. Returning 403 for another tenant's IDs confirms which IDs are real.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only project owners can delete a project. Your role on project prj_8812 is member.",
  "instance": "/v1/projects/prj_8812",
  "requiredRole": "owner",
  "currentRole": "member"
}
```

The request that triggers it is valid in every way except who sent it:

```http
DELETE /v1/projects/prj_8812 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...
```

RFC 9457 points out that a problem type for a truly generic condition adds little, because a 403 on its own already says "not allowed". This type earns its place through the extension members: a stable, machine-readable reason a client can branch on and show to the user. Do not put internal policy names or rule IDs in it.
