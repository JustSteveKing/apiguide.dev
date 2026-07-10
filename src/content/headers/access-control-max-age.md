---
name: "Access-Control-Max-Age"
description: "Specifies how long the results of a CORS preflight request can be cached by the browser."
category: "response"
standard: true
relatedCodes: [204]
---

## What is the Access-Control-Max-Age header?

The `Access-Control-Max-Age` response header tells the browser how many seconds it may cache the result of a CORS preflight request, including the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` values. While cached, the browser skips the preflight for matching requests.

## API Usage & Best Practices

* **Cuts preflight round-trips**: A higher value reduces latency by avoiding a repeated `OPTIONS` request before each actual call.
* **Mind browser caps**: Browsers enforce their own maximums; Chromium caps the value at 7200 seconds (2 hours) and Firefox at 86400 seconds (24 hours), so larger numbers are silently clamped.
* **Preflight only**: This header belongs on the `OPTIONS` preflight response, typically `204 No Content`.

## Examples

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Max-Age: 600
```
