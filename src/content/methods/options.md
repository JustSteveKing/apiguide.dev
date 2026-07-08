---
name: "OPTIONS"
description: "Describes the communication options for the target resource."
safe: true
idempotent: true
cacheable: false
relatedCodes: [200, 204]
---

## What is the OPTIONS method?

The `OPTIONS` method is used by clients to query the server about which HTTP methods and headers are supported for a specific URL, without executing any actual business logic.

## API Usage & Best Practices

* **CORS Preflights**: Modern web browsers automatically send an OPTIONS request before executing mutating CORS calls (like POST, PUT, DELETE with headers).
* **Speed matters**: Ensure OPTIONS requests respond extremely fast. Avoid loading databases, executing middleware authentication, or running heavy logic.
* **Optimize preflight caching**: Send the `Access-Control-Max-Age` header in the OPTIONS response to instruct browsers to cache the CORS permission, preventing subsequent preflight delays.

## Common Response Codes

* **204 No Content**: The standard response for preflight success containing Access-Control headers.
* **200 OK**: Also acceptable, with or without an empty body.
