---
name: "Access-Control-Expose-Headers"
description: "Lists the response headers that browsers are allowed to expose to client-side JavaScript."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Access-Control-Expose-Headers header?

The `Access-Control-Expose-Headers` response header names which response headers JavaScript is permitted to read on a cross-origin request. Without it, scripts can only access a small CORS-safelisted set such as `Content-Type`, `Cache-Control`, and `Content-Language`.

## API Usage & Best Practices

* **Expose custom headers**: List anything your client needs to read, such as `X-Total-Count` for pagination or a custom `X-Request-Id` for tracing.
* **Sent on the actual response**: Unlike most CORS headers, this one belongs on the actual `200` response, not the preflight. The wildcard `*` exposes all headers but is ignored for credentialed requests.

## Examples

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Expose-Headers: X-Total-Count, X-Request-Id
```
