---
title: Stale Resource Version
statusCode: 409
statusText: Conflict
category: client-error
relatedCodes: ['resource-conflict', 'idempotency-key-conflict']
publishedDate: 2026-05-05
---

## When to use it

Use 409 Stale Resource Version when implementing optimistic concurrency control (OCC) and the client attempts to update or delete a resource using an outdated version indicator (such as an `ETag`, `version` integer, or `updated_at` timestamp).

This indicates that another user or process has updated the resource since the client last fetched it, preventing the client from overwriting those changes (the "lost update" problem).

## When not to use it

Do not use this for general data conflicts like duplicate unique values (use `resource-conflict`). Do not use this if the client is sending concurrent duplicate API calls using an idempotency key (use `idempotency-key-conflict`).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/stale-resource-version",
  "title": "Stale Resource Version",
  "status": 409,
  "detail": "The resource version '5' is stale. The resource has been updated by another process and is now version '6'.",
  "instance": "/v1/leads/lead_12345"
}
```

Return the current `ETag` so the client can re-fetch, alongside the `If-Match` value it sent that was rejected:

```
ETag: "6"
If-Match: "5"
```
