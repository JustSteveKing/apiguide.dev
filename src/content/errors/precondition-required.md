---
title: Precondition Required
statusCode: 428
statusText: Precondition Required
category: client-error
relatedCodes: ['precondition-failed', 'stale-resource-version', 'resource-conflict']
publishedDate: 2026-10-08
---

## When to use it

Use 428 Precondition Required, defined in RFC 6585, when the server requires a state-changing request to be conditional and the client sent it without any precondition. In practice that means a `PUT`, `PATCH` or `DELETE` that arrives with neither `If-Match` nor `If-Unmodified-Since` on a resource where the server enforces optimistic concurrency control.

The point is to prevent lost updates. Without a precondition the server has no way to tell whether the client saw the current state before writing, so an unconditional write would silently overwrite whatever another actor changed in the meantime. Rejecting it with 428 forces the client to read the resource, take its `ETag`, and state which version it intends to replace. RFC 6585 asks that the response explain how to resubmit the request successfully, which is what the `detail` member is for.

## When not to use it

Do not use 428 when the client did send a precondition and it did not hold. That is `precondition-failed` (412): the `If-Match` value no longer matches the current `ETag`, or the resource changed after the `If-Unmodified-Since` date. 428 is only for the case where the precondition is absent.

Do not use 428 when the client sent a version in the request body, such as a `version` integer, and that version is out of date. That is `stale-resource-version` (409). If your API carries versions in the body rather than in headers, a missing version field is a validation problem and belongs in `validation-failed`, not 428.

Do not use 428 on endpoints that accept unconditional writes, and do not return it for safe methods such as `GET`. Do not start requiring preconditions on an existing endpoint without warning, either: every client that writes without `If-Match` today will begin failing on the next request, so treat the change as a breaking one and announce it before you enforce it.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/precondition-required",
  "title": "Precondition Required",
  "status": 428,
  "detail": "Updates to this resource must be conditional. Fetch the resource, read its ETag, and retry the request with that value in the If-Match header.",
  "instance": "/v1/documents/8123"
}
```

The request that triggers this response is a write with no conditional header at all:

```http
PATCH /v1/documents/8123 HTTP/1.1
Host: api.example.com
Content-Type: application/json
```

To recover, the client should `GET` the resource, read the `ETag` from the response, and retry the write with `If-Match: "<etag>"`. If the resource changes again before the retry lands, the server responds with `precondition-failed` (412) and the client repeats the read. RFC 6585 also states that a 428 response must not be stored by a cache.
