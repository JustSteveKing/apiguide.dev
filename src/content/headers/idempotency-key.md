---
name: "Idempotency-Key"
description: "Custom request header used to prevent duplicate operations (mutations) on the server."
category: "request"
standard: false
relatedCodes: [409]
---

## What is the Idempotency-Key header?

The `Idempotency-Key` request header is a custom (non-standard but widely adopted) header sent by clients to ensure that a request is processed exactly once, protecting against networks glitches and double-submits.

## API Usage & Best Practices

* **Generate unique keys**: Clients should send a UUID or unique key for each write request (POST, PATCH).
* **Return cached results**: If the server receives a request with a key it has already processed, it returns the cached response rather than running the business logic again.
* **Conflict check**: If the payload differs from the cached original, reject with `409 Conflict`.

## Examples

```http
POST /v1/charges HTTP/1.1
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json
```
