---
name: "Authorization"
description: "Contains the credentials to authenticate the client with the server."
category: "request"
standard: true
relatedCodes: [401, 403]
---

## What is the Authorization header?

The `Authorization` request header carries credentials that authenticate the client request, granting access to protected API endpoints.

## API Usage & Best Practices

* **Use the Bearer scheme**: For modern token-based APIs (JWTs, OAuth2, API Keys), format the header as `Bearer <token>`.
* **Never transmit sensitive keys in query strings**: Always pass credentials in the `Authorization` header to prevent them from being logged in proxy servers.
* **Shared caches skip authenticated responses**: Per RFC 9111, a shared cache (like a CDN) must not store a response to a request that carried an `Authorization` header unless the response explicitly opts in with a directive such as `public`, `must-revalidate`, or `s-maxage`.

## Examples

```http
GET /v1/leads HTTP/1.1
Host: api.apiguide.dev
Authorization: Bearer api_key_abc123xyz
```
