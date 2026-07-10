---
name: "Vary"
description: "Lists the request headers a response depends on, controlling cache key selection."
category: "response"
standard: true
relatedCodes: [200, 304]
---

## What is the Vary header?

The `Vary` response header, defined in RFC 9110, names the request headers that a cache must consider before serving a stored response. It tells caches that the same URL can produce different representations depending on those headers.

## API Usage & Best Practices

* **Correct content negotiation**: Listing `Accept`, `Accept-Encoding`, or `Accept-Language` ensures a client asking for JSON is never served a cached HTML response, and a gzip-capable client is not handed a brotli body it cannot read.
* **Protect private data**: Including `Authorization` prevents a shared cache from returning one user's personalized response to another.
* **Use the wildcard sparingly**: `Vary: *` means the response varies on factors outside the request headers, which effectively makes it uncacheable by shared caches.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json
Vary: Accept, Accept-Encoding
```
