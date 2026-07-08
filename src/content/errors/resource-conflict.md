---
title: Resource Conflict
statusCode: 409
statusText: Conflict
category: client-error
relatedCodes: ['idempotency-key-conflict', 'stale-resource-version']
publishedDate: 2026-07-07
---

## When to use it

Use 409 Resource Conflict when the request cannot be completed due to a conflict with the current state of the target resource. The most common use case is a uniqueness constraint violation, such as attempting to register a user with an email address that is already active in the database.

It is also appropriate when deleting a resource is blocked because it has active references or dependencies (e.g., trying to delete an organization that still contains active user profiles).

## When not to use it

Do not use 409 for general input validation failures (like a malformed email address or a missing field). Use `validation-failed` (422) for those. Do not use 409 if the client is submitting concurrent requests with the same idempotency key; use `idempotency-key-conflict` instead.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/resource-conflict",
  "title": "Resource Conflict",
  "status": 409,
  "detail": "A user with the email address 'jane.doe@example.com' already exists.",
  "instance": "/v1/users"
}
```
