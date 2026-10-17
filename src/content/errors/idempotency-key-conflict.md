---
title: Idempotency Key Conflict
statusCode: 422
statusText: Unprocessable Content
category: client-error
relatedCodes: ['resource-conflict', 'stale-resource-version']
publishedDate: 2026-05-19
updatedDate: 2026-10-14
---

## When to use it

Use 422 with an Idempotency Key Conflict error when a client sends an `Idempotency-Key` that it has already used, but with a different request payload. The server cannot treat the request as a retry of the original, because it is not the same request, and it must not execute it as a new one, because the key says it is a retry. Rejecting it prevents a client bug from silently returning the cached result of a different operation, or duplicating a mutation such as a charge.

This follows the IETF HTTPAPI working group's Internet-Draft `draft-ietf-httpapi-idempotency-key-header` (revision -07), which recommends 422 for a key reused with a different payload. The draft is not an RFC and has expired, so treat it as the best available convention rather than a standard.

The same draft recommends 409 Conflict for the other misuse of a key: a retry that arrives while the original request with that key is still being processed. Use this same problem type for that case with `status` set to 409, and send a short `Retry-After`. The status code tells the client which case it hit: a 409 can be retried unchanged once the original finishes, while a 422 never succeeds until the client sends the original payload or generates a new key.

## When not to use it

Do not use this for an identical retry with a previously seen key. That is the case idempotency keys exist for: return the stored response from the original request, not an error.

Do not use this when the key is missing on an operation that requires one. The draft recommends 400 Bad Request for that, with a link to documentation explaining the requirement. It is a malformed request, not a conflict.

Do not use this for general business logic conflicts, such as attempting to create a user with an email address that is already registered. In those cases, use `resource-conflict`.

## Example response

A key reused with a different payload:

```json
{
  "type": "https://apiguide.dev/errors/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 422,
  "detail": "The Idempotency-Key 'key_abc123' has already been used for a different request payload. Resend the original payload, or use a new key for a new request.",
  "instance": "/v1/charges"
}
```

A retry that arrives while the original request is still in flight uses the same type with 409, and tells the client when to try again:

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Retry-After: 5

{
  "type": "https://apiguide.dev/errors/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 409,
  "detail": "A request with Idempotency-Key 'key_abc123' is still being processed. Retry the same request after it completes.",
  "instance": "/v1/charges"
}
```
