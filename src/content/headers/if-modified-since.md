---
name: "If-Modified-Since"
description: "Makes the request conditional; execution occurs only if the resource has changed since the given date."
category: "request"
standard: true
relatedCodes: [304]
---

## What is the If-Modified-Since header?

The `If-Modified-Since` request header is used to check if a resource has been updated since a specific timestamp.

## API Usage & Best Practices

* **Used as a fallback**: Often used in place of ETags when date-based resolution is preferred or when proxy caches do not support ETags.
* **Format requirements**: Must contain a valid HTTP date (e.g. GMT format).

## Examples

```http
GET /v1/leads HTTP/1.1
If-Modified-Since: Tue, 07 Jul 2026 10:00:00 GMT
```
