---
name: "Cache-Control"
description: "Directives for caching mechanisms in both requests and responses."
category: "both"
standard: true
relatedCodes: [200, 304]
---

## What is the Cache-Control header?

The `Cache-Control` header specifies instructions for caching in both client browsers and intermediary proxies (like CDNs).

## API Usage & Best Practices

* **Disable caching for mutations**: For POST, PUT, PATCH, and DELETE operations, ensure responses carry `Cache-Control: no-store, max-age=0`.
* **Use for static lookups**: If an API returns static configurations (like country lists), use `Cache-Control: public, max-age=86400` to encourage caching.

## Examples

```http
HTTP/1.1 200 OK
Cache-Control: no-store, no-cache, must-revalidate
```
