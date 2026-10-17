---
name: "Early-Data"
description: "Added by an intermediary to mark a request that was received in TLS 1.3 early data (0-RTT) and could be a replay."
category: "request"
standard: true
relatedCodes: [425]
reference:
  title: "RFC 8470"
  url: https://www.rfc-editor.org/rfc/rfc8470.html
updatedDate: 2026-10-14
---

## What is the Early-Data header?

The `Early-Data` request header, defined in RFC 8470, marks a request that arrived in TLS 1.3 early data, also called 0-RTT: data a client sends with its first flight on a resumed connection, before the handshake completes. Early data can be captured and replayed by an attacker, so the origin needs to know when a request might be a duplicate. The header has exactly one valid value, `1`.

It is set by intermediaries, not by user agents. A CDN, load balancer or reverse proxy that forwards a request before its own TLS handshake with the client has completed MUST add `Early-Data: 1`, and no intermediary may remove it. A request carrying it that the server cannot safely process MUST be rejected with [`425 Too Early`](/status-codes/425); the client then retries after the handshake, and that retry MUST NOT be sent in early data.

## API Usage & Best Practices

* **Reject unsafe requests that carry it**: If your edge terminates TLS with 0-RTT enabled, check for `Early-Data: 1` at the origin and answer `425` for anything with side effects. Absent per-resource configuration, RFC 8470 says origin servers MUST either reject early data or implement replay mitigations.
* **Do not decide on method alone**: Absent other information, RFC 8470 lets clients send only safe methods such as [`GET`](/methods/get) and [`HEAD`](/methods/head) in early data, and forbids unsafe ones. But the RFC also notes that some resources have side effects even on safe methods. A `GET` that triggers a one-time action, consumes a single-use link or increments a metered counter is not replay-safe. Let each route declare whether early data is acceptable, as the RFC recommends.
* **Idempotency keys do not make early data safe for free**: An [`Idempotency-Key`](/headers/idempotency-key) store that dedupes concurrent requests reliably can absorb replays, but only if it is shared across every server instance that could receive the replayed copy. RFC 8470 says a server MUST NOT act on early data before the handshake completes if another instance could decide differently about the same data.
* **Waiting for the handshake does not help at the origin**: The request was sent in early data on a previous hop. The origin cannot make it safe by waiting, only by rejecting or by a replay-tolerant design.
* **Only send 425 when the client can retry**: A server SHOULD NOT send `425` unless the request arrived in early data or carried `Early-Data: 1`, since only then can it assume the client understands the code. Intermediaries MUST pass a `425` back when the request they forwarded carried the header.
* **Turn 0-RTT off if you cannot reason about it**: For an API dominated by writes, the latency saved by 0-RTT rarely justifies the replay analysis. Leave it disabled at the edge until you have done that analysis.

## Examples

A side-effecting `GET` forwarded by a CDN before the client handshake completed:

```http
GET /v1/invitations/3f9c2a/accept HTTP/1.1
Host: api.example.com
Early-Data: 1
```

The origin refusing to risk a replay:

```http
HTTP/1.1 425 Too Early
Content-Type: application/problem+json
```
