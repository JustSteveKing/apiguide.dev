---
name: "Age"
description: "The time in seconds since a cached response was generated at the origin server."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Age header?

The `Age` response header, defined in RFC 9111, gives the estimated number of seconds that have elapsed since the response was produced by the origin server. It is added by caches and CDNs, so its presence usually means the response was served from a cache rather than freshly generated.

## API Usage & Best Practices

* **Estimate freshness**: Comparing `Age` against the freshness lifetime from `Cache-Control: max-age` tells you how much of a cached response's usable life remains.
* **Diagnose caching**: A large `Age` value confirms a request was satisfied by a CDN edge, which is useful when debugging why clients are seeing stale data.

## Examples

```http
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Age: 118
```
