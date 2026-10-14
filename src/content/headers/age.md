---
name: "Age"
description: "The time in seconds since a cached response was generated at the origin server."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Age header?

The `Age` response header, defined in RFC 9111, gives the sender's estimate, in seconds, of the time since the response was generated or successfully validated at the origin server. It is added by caches and CDNs. RFC 9111 states that its presence implies the response was not generated or validated by the origin for this request, but the reverse does not hold: a response without `Age` may still have come from a cache that does not send it.

## API Usage & Best Practices

* **Estimate freshness**: Comparing `Age` against the freshness lifetime from `Cache-Control: max-age` tells you how much of a cached response's usable life remains.
* **Diagnose caching**: Any `Age` value, including `0`, means some cache on the path answered the request, which is useful when debugging why clients are seeing stale data. It does not say which cache; use [`Cache-Status`](/headers/cache-status) for that.

## Examples

```http
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Age: 118
```
