---
title: Idempotency Key Conflict
statusCode: 409
statusText: Conflict
category: client-error
relatedCodes: ['resource-conflict', 'stale-resource-version']
publishedDate: 2026-05-19
---

## When to use it

Use 409 with an Idempotency Key Conflict error when a client makes a request using an `Idempotency-Key` header that has already been used, but the payload or request parameters do not match the original request, or when the initial request is still being processed.

This prevents race conditions and accidental duplication of mutations (like charges or resource creation) while notifying the client that they are reusing a key incorrectly.

## When not to use it

Do not use this for general business logic conflicts, such as attempting to create a user with an email address that is already registered. In those cases, use `resource-conflict`.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 409,
  "detail": "The Idempotency-Key 'key_abc123' has already been used for a different request payload.",
  "instance": "/v1/charges"
}
```

Echo the key back so the client can confirm which request is in conflict, and include a short `Retry-After` if the original request is still being processed:

```
Idempotency-Key: key_abc123
Retry-After: 5
```
