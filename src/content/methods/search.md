---
name: "SEARCH"
description: "Runs a server-side query described in the request body against a resource, in WebDAV."
safe: true
idempotent: true
cacheable: false
relatedCodes: [200, 207, 422]
---

## What is the SEARCH method?

The `SEARCH` method is a WebDAV extension (RFC 5323) used by clients to send a query in the request body and have the server return matching resources, without changing any state.

## API Usage & Best Practices

* **Query in the body**: Unlike GET, SEARCH carries its query in the request body, allowing rich, structured criteria.
* **Read-only and repeatable**: SEARCH is safe and idempotent, so repeating a query has no side effects on the server and it can be retried freely. The results can still change between calls as the underlying data changes.
* **Know the overlap**: SEARCH overlaps with the [`QUERY`](/methods/query) method, standardized in RFC 10008 as the general-purpose safe, idempotent read with a body. Outside WebDAV, use `QUERY` rather than SEARCH.

## Common Response Codes

* **200 OK**: The query succeeded and results are returned in the body.
* **207 Multi-Status**: Per-resource results are returned for a WebDAV-style search.
* **422 Unprocessable Content**: The query body was well-formed but could not be understood or executed.
