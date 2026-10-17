---
title: Too Early
statusCode: 425
statusText: Too Early
category: client-error
relatedCodes: ['idempotency-key-conflict', 'service-unavailable', 'misdirected-request']
publishedDate: 2026-10-17
---

## When to use it

Use [`425 Too Early`](/status-codes/425) when a request arrived in TLS 1.3 early data (0-RTT), or was forwarded by an intermediary with [`Early-Data: 1`](/headers/early-data), and processing a replayed copy of it would cause a side effect you are not prepared to repeat. RFC 8470 defines the code as a server that "is unwilling to risk processing a request that might be replayed".

The request itself is fine. Only the way it was delivered is the problem: early data is sent before the handshake completes, so an attacker who captured it can send it again. RFC 8470 says a user agent SHOULD retry a 425 automatically, and that the retry MUST NOT be sent in early data. Most clients never see this response, because their HTTP stack retries it for them.

The realistic cases in an API are requests the client treated as safe that are not safe on your server: a [`GET`](/methods/get) that consumes a single-use link, accepts an invitation, or counts against a metered quota. Decide per route whether early data is acceptable, and answer 425 on the routes where it is not.

## When not to use it

Do not use it unless the request actually arrived in early data or carries `Early-Data: 1`. RFC 8470 says a server SHOULD NOT send 425 otherwise, because only then can it assume the client understands the code and is able to retry.

Do not use it as a general replay or duplicate check. A request repeated after the handshake, or a duplicate [`POST`](/methods/post), is a retry problem, not an early-data problem. That is what an [`Idempotency-Key`](/headers/idempotency-key) is for, and a misused key is `idempotency-key-conflict`.

Do not use it to shed load or to ask the client to back off. A 425 retry can go out as soon as the handshake completes. If the server cannot take the request right now, that is `service-unavailable` (503).

## Example response

```http
HTTP/1.1 425 Too Early
Content-Type: application/problem+json

{
  "type": "https://apiguide.dev/errors/too-early",
  "title": "Too Early",
  "status": 425,
  "detail": "This request was received in TLS early data, and accepting an invitation cannot be safely replayed. Retry it after the TLS handshake completes.",
  "instance": "/v1/invitations/3f9c2a/accept"
}
```

RFC 8470 requires an intermediary to forward a 425 back to the client when the request it forwarded carried `Early-Data: 1`, so the origin's answer reaches the party that can actually retry. The code is not cacheable by default.
