---
name: "Cookie"
description: "Sends previously stored cookies from the client back to the server."
category: "request"
standard: true
---

## What is the Cookie header?

The `Cookie` request header, defined in RFC 6265, carries the name/value pairs the client previously received via `Set-Cookie` for the current domain and path. It is the mechanism that lets a stateless HTTP server recognize a returning client.

## API Usage & Best Practices

* **Cookie sessions vs token auth**: Cookie-based sessions are sent automatically by browsers, whereas token schemes like `Authorization: Bearer` are attached explicitly by the API client, which many APIs prefer for statelessness.
* **Mind CSRF**: Because cookies are sent automatically, cookie-authenticated APIs need CSRF protection such as `SameSite` cookies or anti-CSRF tokens.
* **Keep it lean**: Send only the cookies a request needs, since large cookie payloads add overhead to every request.

## Examples

```http
GET /v1/profile HTTP/1.1
Host: api.example.com
Cookie: session_id=abc123; theme=dark
```
