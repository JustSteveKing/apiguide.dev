---
name: "If-None-Match"
description: "Makes the request conditional; execution occurs only if the client ETag does not match the server ETag."
category: "request"
standard: true
relatedCodes: [304, 412]
---

## What is the If-None-Match header?

The `If-None-Match` request header is used for conditional GET requests. The server will send the full resource only if the current ETag on the server does not match the client's ETag.

## API Usage & Best Practices

* **Enable HTTP/CDN Caching**: Essential for optimizing mobile apps or web frontends querying configuration, catalogs, or large asset datasets.
* **Returns 304**: If the ETags match, return `304 Not Modified` with no body.

## Examples

```http
GET /v1/leads/lead_123 HTTP/1.1
If-None-Match: "w/3a84e27f01"
```
