---
name: "Accept-Encoding"
description: "Declares what compression algorithms the client supports for the response payload."
category: "request"
standard: true
relatedCodes: [406]
---

## What is the Accept-Encoding header?

The `Accept-Encoding` request header advertises the compression formats (such as `gzip`, `deflate`, or `br` for Brotli) that the client is capable of decoding.

## API Usage & Best Practices

* **Enable compression at the gateway**: Ensure your API gateway or web server (Nginx, Cloudflare) automatically compresses JSON payloads using the best algorithm supported by the client.
* **Significant performance gains**: Compressing JSON responses can reduce payload size by up to 70-80% for large lists.

## Examples

```http
GET /v1/leads HTTP/1.1
Host: api.apiguide.dev
Accept-Encoding: gzip, deflate, br
```
