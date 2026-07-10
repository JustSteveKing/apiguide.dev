---
name: "Access-Control-Allow-Origin"
description: "Specifies which origin(s) are permitted to read the response in a CORS request."
category: "response"
standard: true
relatedCodes: [200, 204]
---

## What is the Access-Control-Allow-Origin header?

The `Access-Control-Allow-Origin` response header tells the browser which origin is allowed to read the response of a cross-origin request. It is either a single origin, the wildcard `*`, or the specific origin echoed back from the request's `Origin` header.

## API Usage & Best Practices

* **Echo, don't hardcode `*` blindly**: For APIs serving multiple trusted apps, validate the incoming `Origin` against an allowlist and echo it back, adding `Vary: Origin` so caches stay correct.
* **`*` blocks credentials**: The wildcard cannot be combined with `Access-Control-Allow-Credentials: true`; requests carrying cookies or auth headers require an explicit origin instead.
* **Preflight and actual response**: Send it on both the preflight (`204`) and the actual `200` response, or the browser rejects the result.

## Examples

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Vary: Origin
```
