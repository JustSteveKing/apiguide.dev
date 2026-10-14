---
name: "QUERY"
description: "A safe, idempotent, cacheable method that carries the query in the request body, for reads that do not fit in a URI. Defined in RFC 10008."
safe: true
idempotent: true
cacheable: true
relatedCodes: [200, 400, 406, 415, 422]
---

## What is the QUERY method?

`QUERY` is the HTTP method defined in RFC 10008, "The HTTP QUERY Method" (Standards Track, June 2026). It asks the target resource to perform a query described by the request content and return the result. It is safe and idempotent like `GET`, and its responses are cacheable, but the query travels in the body, so it can carry a large or complex payload (a structured filter, a query language document, a long list of IDs) without cramming it into a URI.

This solves a common workaround problem: teams that need a "GET with a body" either use `POST` (losing safety, idempotency and cacheability) or squeeze the query into an unwieldy query string. `QUERY` gives that pattern a standard to point to. Because the content is less likely than the URI to be logged by intermediaries, RFC 10008 also notes it as an option when a query contains sensitive values.

## API Usage & Best Practices

* **Check the path before you depend on it**: `QUERY` is a recent addition to HTTP. Test every proxy, CDN, gateway, framework and client library between your clients and your origin before exposing it in a public contract, and keep a `POST` search endpoint as a fallback for clients that cannot send it.
* **Content-Type is mandatory**: The media type defines the query. RFC 10008 requires servers to fail the request when `Content-Type` is missing or inconsistent with the content, and forbids sniffing the content to guess a type.
* **Advertise what you accept**: Use [`Accept-Query`](/headers/accept-query) to list the query media types a resource supports, and include `QUERY` in [`Allow`](/headers/allow).
* **Body carries the query, not a mutation**: The request describes what to retrieve, not a change to make. Do not repurpose it for writes; clients and intermediaries are entitled to retry it automatically.
* **Cache keys include the body**: RFC 10008 requires a cache key for `QUERY` to incorporate the request content and its metadata. Return a [`Location`](/headers/location) for the equivalent resource if you can, so clients can switch to a plain `GET` for repeat queries, and use [`Content-Location`](/headers/content-location) to point at a stored copy of the results.
* **Expect a CORS preflight**: `QUERY` is not a CORS-safelisted method, so browser clients will send an `OPTIONS` preflight first.

## Common Response Codes

* **200 OK**: The query was processed and the results are returned in the response body.
* **400 Bad Request**: The request has no media type, or the declared `Content-Type` is inconsistent with the content.
* **406 Not Acceptable**: The client's `Accept` header asks for a response media type the resource cannot produce.
* **415 Unsupported Media Type**: The query media type is not supported by the resource, including a type known in general but without query semantics there. Send `Accept-Query` listing what would work.
* **422 Unprocessable Content**: The media type is understood and the content is consistent with it, but the query itself cannot be processed, for example a syntactically valid SQL query naming a table that does not exist.
