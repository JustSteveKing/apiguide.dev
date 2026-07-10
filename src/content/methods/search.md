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
* **Read-only and repeatable**: SEARCH is safe and idempotent, so the same query returns consistent results and can be retried freely.
* **Know the overlap**: SEARCH conceptually overlaps with the newer QUERY method, which aims to standardise body-bearing reads more broadly.

## Common Response Codes

* **200 OK**: The query succeeded and results are returned in the body.
* **207 Multi-Status**: Per-resource results are returned for a WebDAV-style search.
* **422 Unprocessable Content**: The query body was well-formed but could not be understood or executed.
