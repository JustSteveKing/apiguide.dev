---
name: "Access-Control-Request-Method"
description: "Sent by the browser in a CORS preflight to announce the method of the actual request."
category: "request"
standard: true
relatedCodes: [204]
---

## What is the Access-Control-Request-Method header?

The `Access-Control-Request-Method` request header is set automatically by the browser during a CORS preflight (`OPTIONS`) request. It tells the server which HTTP method the actual cross-origin request will use, so the server can decide whether to permit it.

## API Usage & Best Practices

* **Browser-controlled**: You cannot set this header manually; the browser adds it to the preflight when the upcoming request uses a non-simple method like `PUT` or `DELETE`.
* **Answered by the server**: The server replies with `Access-Control-Allow-Methods` on the `204` preflight response to confirm the method is allowed.

## Examples

```http
OPTIONS /api/users/42 HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
```
