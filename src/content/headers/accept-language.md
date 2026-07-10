---
name: "Accept-Language"
description: "Advertises the natural languages the client prefers for the response."
category: "request"
standard: true
relatedCodes: [406]
---

## What is the Accept-Language header?

The `Accept-Language` request header tells the server which natural languages the client prefers, using language tags with optional quality (`q`) values to express relative preference. The server uses it during content negotiation to choose a language variant.

## API Usage & Best Practices

* **Use q-values to rank**: A weight from `0` to `1` orders preferences, for example `fr-CH, fr;q=0.9, en;q=0.8`.
* **Handle unsupported languages**: If no acceptable language can be served, the server may respond with `406 Not Acceptable`, though returning a sensible default is often friendlier.
* **Confirm with `Content-Language`**: The chosen variant should be echoed back in the response's `Content-Language` header.

## Examples

```http
GET /articles/42 HTTP/1.1
Host: api.example.com
Accept-Language: fr-CH, fr;q=0.9, en;q=0.8, *;q=0.5
```
