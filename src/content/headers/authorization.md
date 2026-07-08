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

## Examples

```http
GET /v1/leads HTTP/1.1
Host: api.apiguide.dev
Authorization: Bearer api_key_abc123xyz
```
