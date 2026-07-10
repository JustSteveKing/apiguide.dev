---
title: "Precondition Failed"
statusCode: 412
statusText: Precondition Failed
category: client-error
relatedCodes: ['stale-resource-version', 'resource-conflict']
publishedDate: 2026-07-09
---

## When to use it

Use 412 Precondition Failed when the client attaches a conditional header such as `If-Match` or `If-Unmodified-Since`, and the condition evaluates to false because the resource changed on the server since the client last saw it. This is the backbone of optimistic concurrency control: the client sends the ETag it believes is current, and the server rejects the write if that ETag no longer matches the live representation.

The typical flow is a read followed by a write. A `GET` returns the resource along with an `ETag`, the client edits its local copy, then sends a `PUT` or `PATCH` carrying `If-Match: "<etag>"`. If another actor updated the resource in the meantime, the stored ETag differs, the precondition fails, and the server responds with 412 rather than silently overwriting the newer state.

## When not to use it

Do not use 412 when the request carries no conditional headers — an unconditional write that hits a version mismatch should surface as `resource-conflict` (409) instead. Do not use 412 for missing `If-Match` on a resource that requires it; that is a 428 Precondition Required. Reserve 412 strictly for the case where a precondition was supplied and demonstrably did not hold. If you need to communicate that the client is holding an outdated snapshot, pair it with the guidance in `stale-resource-version`.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/precondition-failed",
  "title": "Precondition Failed",
  "status": 412,
  "detail": "The resource has been modified since you last fetched it. Re-fetch and retry with the current ETag.",
  "instance": "/v1/documents/8123"
}
```

The client's request that triggers this response includes the conditional header holding the ETag it expects to still be current:

```http
PATCH /v1/documents/8123 HTTP/1.1
Host: api.example.com
If-Match: "a1b2c3d4"
Content-Type: application/json
```

To recover, the client should re-`GET` the resource, read the new `ETag` from the response, reconcile its changes against the updated state, and retry the write with the fresh value in `If-Match`.
