---
name: "Content-Encoding"
description: "Indicates the compression encoding that has been applied to the message body."
category: "both"
standard: true
relatedCodes: [200]
---

## What is the Content-Encoding header?

The `Content-Encoding` header lists any compression that has been applied to the representation body, so the recipient knows which transformation to reverse before decoding. Common values are `gzip`, `br` (Brotli), `zstd`, and `deflate`.

## API Usage & Best Practices

* **Pair with `Accept-Encoding`**: A server should only apply an encoding that the client advertised as acceptable in its `Accept-Encoding` request header.
* **Reduce payload size**: Compressing JSON responses with `gzip` or `br` can dramatically cut bandwidth for API responses.
* **Order matters**: When multiple encodings are applied, list them in the order they were applied so the client can reverse them correctly.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
```
