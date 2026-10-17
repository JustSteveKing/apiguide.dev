---
title: Endpoint Sunset
statusCode: 410
statusText: Gone
category: client-error
relatedCodes: ['gone', 'unsupported-api-version', 'resource-not-found']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`410 Gone`](/status-codes/410) with an Endpoint Sunset error when a client calls a piece of API surface you have retired on purpose: an endpoint, an operation, or a path-versioned API such as everything under `/v1/`. The endpoint was deprecated, its sunset date has passed, and it has been switched off.

This is a more specific type than `gone`. `gone` says a resource no longer exists, and it fits a deleted record as well as a retired endpoint. This type says the interface itself was retired as part of a planned migration, which tells the client the problem is in its code, not in its data, and that there is a documented replacement to move to. A client can branch on it to raise an alert for a developer rather than quietly dropping a record ID.

It is the end of a lifecycle that starts earlier, with two headers on every successful response. RFC 9745 defines [`Deprecation`](/headers/deprecation), which says when the endpoint was or will be deprecated. RFC 8594 defines [`Sunset`](/headers/sunset), which says when it is expected to stop responding. RFC 9745 says the sunset time MUST NOT be earlier than the deprecation time. RFC 8594 expects that after the sunset time, interactions are likely to produce a client error, a redirect, or no response at all; this type is the client error, made explicit. The [deprecation and sunsetting guide](/guides/deprecation-sunsetting) covers the whole sequence.

Put the replacement in the body. A client that hits a retired endpoint in production needs the successor and a migration guide now, not after a search through the changelog.

## When not to use it

Do not use it before the sunset date. Until then the endpoint still works: serve it normally, with `Deprecation` and `Sunset` headers. RFC 9745 is explicit that deprecation does not change the behavior of the resource.

Do not use it for a single record that was deleted. That is `gone`, or `resource-not-found` (404) if you keep no record of what was deleted.

Do not use it for a version selected by a header or media type that you no longer serve. The URI still exists in other versions, so that is `unsupported-api-version`. This type fits when the URI itself is what was retired.

Do not use a redirect instead unless the replacement accepts the same request and returns the same response shape. Redirecting a retired endpoint to one with a different contract turns a clear failure into a confusing one.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/endpoint-sunset",
  "title": "Endpoint Sunset",
  "status": 410,
  "detail": "GET /v1/reports was retired on 2026-09-30. Use GET /v2/reports instead.",
  "instance": "/v1/reports",
  "deprecatedAt": "2026-03-31T00:00:00Z",
  "sunsetAt": "2026-09-30T00:00:00Z",
  "successor": "/v2/reports",
  "migrationGuide": "https://developer.example.com/migrations/v2-reports"
}
```

Before the switch-off, the same endpoint announced both dates on every response, with a `sunset` link relation pointing at the migration guide:

```http
HTTP/1.1 200 OK
Deprecation: @1774915200
Sunset: Wed, 30 Sep 2026 00:00:00 GMT
Link: <https://developer.example.com/migrations/v2-reports>; rel="sunset"
```

Keep answering with this type for as long as old clients keep calling. Taking the route away entirely, so it falls through to a generic 404, throws away the one response that tells a stranded client where to go.
