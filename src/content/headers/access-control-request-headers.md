---
name: "Access-Control-Request-Headers"
description: "Sent by the browser in a CORS preflight to announce the custom headers of the actual request."
category: "request"
standard: true
relatedCodes: [204]
---

## What is the Access-Control-Request-Headers header?

The `Access-Control-Request-Headers` request header is set automatically by the browser during a CORS preflight (`OPTIONS`) request. It lists the non-safelisted headers the actual cross-origin request intends to send, letting the server decide whether to allow them.

## API Usage & Best Practices

* **Browser-controlled**: You cannot set this header yourself; the browser generates it when the upcoming request includes headers like `Authorization` or a custom `X-*` header.
* **Answered by the server**: The server replies with `Access-Control-Allow-Headers` on the `204` preflight response to confirm which headers are permitted.

## Examples

```http
OPTIONS /api/users HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```
