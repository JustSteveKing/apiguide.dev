---
title: Gone
statusCode: 410
statusText: Gone
category: client-error
relatedCodes: ['resource-not-found', 'endpoint-sunset', 'unsupported-api-version', 'method-not-allowed']
publishedDate: 2026-10-14
updatedDate: 2026-10-17
---

## When to use it

Use 410 Gone when a resource has been removed on purpose and will not come back. RFC 9110 defines it as access to the target resource being "no longer available at the origin server" with the condition "likely to be permanent", and describes it as telling the recipient that "the resource is intentionally unavailable".

In an API this has two common cases:

- **A sunset endpoint or version.** An endpoint was deprecated, its [`Sunset`](/headers/sunset) date has passed, and it has been switched off. RFC 8594 says that after the sunset time, interactions are likely to result in client errors, redirects or no response at all. 410 is the client error that says exactly what happened. If you want the `type` itself to say that API surface was retired, rather than a resource deleted, use the narrower `endpoint-sunset`; this type stays correct for both.
- **A deleted record you still remember.** The record was hard-deleted and you kept a tombstone, so you can tell a deleted ID apart from one that never existed.

410 is useful because it is final. A client that gets one should stop calling that URI, remove stored references to it and, for a sunset endpoint, migrate. Put the replacement in the body so the client does not have to search the changelog for it.

## When not to use it

Do not use it when you do not know whether the resource ever existed or whether its absence is permanent. RFC 9110 is explicit: if the server "does not know, or has no facility to determine" whether the condition is permanent, use 404. That is `resource-not-found`, and it is the right answer for most missing IDs, because most systems do not keep tombstones.

Do not use it for a soft delete that can still be undone within a restore window. The resource is not permanently gone, and telling clients to drop their references to something a user may restore tomorrow is wrong.

Do not use it before the sunset date. Until then the endpoint still works: serve it normally with `Sunset` and [`Deprecation`](/headers/deprecation) headers. 410 is for after the switch-off.

Do not use it for an API version requested in a header or media type that you no longer serve. The resource still exists in other versions, so that is `unsupported-api-version`. 410 fits a path-versioned URI such as `/v1/search` that has been retired, because there the URI itself is what has gone.

Do not use it for a method a resource no longer accepts while the resource itself stays. That is `method-not-allowed` (405).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/gone",
  "title": "Gone",
  "status": 410,
  "detail": "GET /v1/search was sunset on 2026-06-30 and has been removed. Use GET /v2/search.",
  "instance": "/v1/search",
  "sunsetAt": "2026-06-30T00:00:00Z",
  "successor": "/v2/search",
  "migrationGuide": "https://developer.example.com/migrations/v1-search"
}
```

Before the switch-off, the same endpoint announced the date on every response:

```http
HTTP/1.1 200 OK
Deprecation: @1767225600
Sunset: Tue, 30 Jun 2026 00:00:00 GMT
Link: <https://developer.example.com/migrations/v1-search>; rel="sunset"
```

RFC 9110 makes 410 heuristically cacheable, so a cache may keep serving it without explicit freshness information. That is usually what you want for a permanent removal. If there is any chance you will bring the URI back, send `Cache-Control` with a short lifetime, or reconsider whether 410 is the right code at all.
