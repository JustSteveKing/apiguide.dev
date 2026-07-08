---
name: "RateLimit-Reset"
description: "Indicates the number of seconds remaining until the current rate window resets."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Reset header?

The `RateLimit-Reset` response header indicates the time remaining until the client request quota is reset.

## API Usage & Best Practices

* **IETF Draft Specs**: Standardized to express the countdown in seconds remaining (e.g. `RateLimit-Reset: 42`), replacing old custom implementations that returned epoch timestamps.

## Examples

```http
HTTP/1.1 200 OK
RateLimit-Reset: 16
```
