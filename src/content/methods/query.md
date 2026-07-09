---
name: "QUERY"
description: "Requests that the server process the enclosed content in a safe, idempotent manner and return the result."
safe: true
idempotent: true
cacheable: true
relatedCodes: [200, 206, 304, 400, 404, 415]
---

## What is the QUERY method?

The `QUERY` method requests that the target resource process the enclosed content in a safe and idempotent manner, then respond with the result. It carries query input in the request body, like POST, but preserves the read-only semantics of GET.

## API Usage & Best Practices

* **Safe & idempotent**: QUERY requests must not mutate server state. Clients and intermediaries may safely retry failed requests without risk of duplicate side effects.
* **Body-based queries**: Use QUERY when complex search filters, GraphQL operations, or structured filter objects exceed practical URI length limits and POST would imply unsafe semantics.
* **Cache key includes body**: QUERY responses are cacheable, but caches must incorporate the request content into the cache key, not just the URL, to avoid serving one client's results to another.
* **Advertise support**: Use the `Accept-Query` response header and OPTIONS discovery so clients know which content types a resource accepts for QUERY requests.

## Common Response Codes

* **200 OK**: The query was processed and the result is returned in the body.
* **206 Partial Content**: Used when delivering a range segment of a larger result set.
* **304 Not Modified**: The client's cached copy is still fresh.
* **400 Bad Request**: The query body is structurally malformed or invalid.
* **404 Not Found**: The target resource does not exist.
* **415 Unsupported Media Type**: The server does not accept the query body's content type.
