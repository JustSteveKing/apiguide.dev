---
name: "Origin"
description: "Indicates the origin (scheme, host, and port) that a cross-origin request comes from."
category: "request"
standard: true
relatedCodes: []
---

## What is the Origin header?

The `Origin` request header names the origin (scheme, host, and port) that initiated the request. Browsers send it automatically on all cross-origin (CORS) requests and on every CORS preflight, so the server can decide whether to allow the request.

## API Usage & Best Practices

* **Drives CORS decisions**: Servers compare the incoming `Origin` against an allowlist and echo it back in `Access-Control-Allow-Origin` when the request is permitted.
* **Do not trust for auth**: The value is controlled by the user agent, not the user, so use it for CORS policy only, never as an authentication or authorization signal.
* **No path or query**: Unlike `Referer`, `Origin` never includes the path or query string, so it leaks less information.

## Examples

```http
GET /api/users HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
```
