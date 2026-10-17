---
name: "Idempotency-Key"
description: "Custom request header used to prevent duplicate operations (mutations) on the server."
category: "request"
standard: false
relatedCodes: [400, 409, 422]
reference:
  title: "IETF draft-ietf-httpapi-idempotency-key-header (expired)"
  url: https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
updatedDate: 2026-10-14
---

## What is the Idempotency-Key header?

The `Idempotency-Key` request header is a custom (non-standard but widely adopted) header sent by clients to ensure that a request is processed exactly once, protecting against network glitches and double-submits. Its semantics are described in the IETF Internet-Draft `draft-ietf-httpapi-idempotency-key-header`, which has not become an RFC.

## API Usage & Best Practices

* **Generate unique keys**: Clients should send a UUID or unique key for each write request (POST, PATCH).
* **Return cached results**: If the server receives a request with a key it has already processed, it returns the cached response rather than running the business logic again.
* **Payload check**: If a key is reused with a different payload, reject with [`422 Unprocessable Content`](/status-codes/422), as the draft recommends. See [idempotency key conflict](/errors/idempotency-key-conflict).
* **In-flight check**: If a retry arrives while the original request with that key is still being processed, reject with [`409 Conflict`](/status-codes/409) and a [`Retry-After`](/headers/retry-after).
* **Missing key**: If an operation requires the header and the request omits it, the draft recommends [`400 Bad Request`](/status-codes/400).

## Examples

```http
POST /v1/charges HTTP/1.1
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json
```
