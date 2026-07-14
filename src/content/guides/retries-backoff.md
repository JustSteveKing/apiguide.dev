---
title: "Retries, Backoff & Resilience"
description: "Idempotent retries, exponential backoff with jitter, honoring Retry-After, circuit breakers, and timeouts."
category: "core"
---

## Introduction to Retries and Resilience

Failures in distributed systems are inevitable, so resilient APIs are built to handle them gracefully rather than to avoid them. A robust strategy is layered: clients retry intelligently, servers give explicit guidance, and circuit breakers plus timeouts stop failures from cascading. Applied together, these patterns keep systems responsive under load and during partial outages.

---

## 1. When to Retry

Retries only help when the failure is **transient** — a temporary, self-correcting condition. Retrying a permanent error just wastes quota and adds load.

### Generally safe to retry

| Status | Meaning |
| --- | --- |
| `408 Request Timeout` | Server timed out waiting for the request |
| [`429 Too Many Requests`](/status-codes/429) | Client is being throttled |
| `500 Internal Server Error` | Generic, possibly transient server fault |
| `502 Bad Gateway` | Upstream server issue |
| [`503 Service Unavailable`](/status-codes/503) | Temporary overload or maintenance |
| `504 Gateway Timeout` | Gateway timed out waiting upstream |

These codes are safe to retry **only when the request method is idempotent** — `GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS`, `TRACE`. Retrying a non-idempotent method (`POST`, `PATCH`) risks duplicate side effects if the original request was processed but its response was lost. To retry those safely, make them idempotent with an [`Idempotency-Key`](/headers/idempotency-key) first (see section 4).

### Do not retry

Most `4xx` client errors — `400`, `401`, `403`, `404` — indicate a problem with the request itself that will not resolve on its own. Retrying them only burns resources.

---

## 2. Exponential Backoff with Jitter

Retrying immediately, especially when many clients fail at once, creates a **thundering herd** that overwhelms a recovering service. The fix is exponential backoff with randomized jitter.

* **Exponential backoff**: grow the delay exponentially per attempt (1s, 2s, 4s, 8s), capped at a maximum.
* **Jitter**: add randomness so clients do not retry in synchronized bursts.

Common jitter strategies:

* **Full jitter**: `sleep = random(0, base * 2^attempt)`
* **Equal jitter**: half the exponential delay plus a random portion of the other half.
* **Decorrelated jitter**: grows the next maximum based on the previous delay, spreading retries out further.

```
delay = random(0, 1) * min(max_cap, base_delay * 2^attempt)
```

AWS SDKs widely default to exponential backoff with full jitter and cap the delay (for example, 20 seconds) to avoid excessively long waits.

### Stop conditions

Always bound retries. A practical starting point:

* Max attempts: 3–5 (including the initial request)
* Per-attempt timeout: 1–5 seconds
* Max backoff cap: 10–30 seconds
* Total deadline: 10–60 seconds

Without limits, retries stacked across multiple service layers compound quickly — three retries across three layers can multiply into a far larger load spike on a downstream dependency.

---

## 3. Honoring Retry-After

For `429` and `503` responses, servers can tell clients exactly how long to wait using the [`Retry-After`](/headers/retry-after) header. It accepts two formats:

```http
HTTP/1.1 503 Service Unavailable
Retry-After: 120

HTTP/1.1 429 Too Many Requests
Retry-After: Wed, 21 Apr 2027 07:28:00 GMT
```

The first is a delay in seconds; the second is an HTTP-date. Clients should always honor `Retry-After` when present — it overrides the client's own backoff calculation and prevents further overloading a struggling server. See the [rate limiting](/guides/rate-limiting) guide for how this fits into throttling.

---

## 4. Idempotency: Safe Retries for Writes

**Idempotency** means repeating a request has the same effect as sending it once. This is essential for safely retrying state-changing operations.

Consider a client that sends a [`POST`](/methods/post) to create an order. The server processes it, but the network drops the response. A naive retry creates a duplicate order. The fix is an [`Idempotency-Key`](/headers/idempotency-key) header carrying a unique value (typically a V4 UUID):

```http
POST /v1/orders HTTP/1.1
Host: api.apiguide.dev
Idempotency-Key: 8fce09a4-7f7c-4c2e-9c2a-1d3f6b2a91e7
Content-Type: application/json

{ "sku": "WIDGET-1", "qty": 2 }
```

The server stores the key with the resulting status and body. If the same key arrives again, it returns the original result — including the original error — without re-processing. `GET`, [`PUT`](/methods/put), and `DELETE` are idempotent by definition, so they generally do not need a key; `POST` does. See the [idempotency](/guides/idempotency) guide for the full workflow.

---

## 5. Circuit Breakers and Timeouts

### Circuit breaker

A circuit breaker stops a client from repeatedly calling a service that is likely to fail, letting the failing service recover. It has three states:

* **Closed**: requests flow through; failures are counted.
* **Open**: once a failure threshold is crossed (for example, 5% failures in 5 minutes), requests fail fast without hitting the service.
* **Half-open**: after a cooldown, a few trial requests are allowed. Success closes the circuit; failure reopens it.

Combining retries with a circuit breaker prevents retries from piling onto an already-overloaded dependency.

### Timeouts

Explicit client-side timeouts stop resources from being held indefinitely.

* **Connection timeout**: max time to establish the connection. A conservative starting point is roughly 3× the round-trip time.
* **Request timeout**: max time to wait for a response once connected, tuned from observed latency and SLAs.

Default timeouts are often infinite or far too high. Cooperative timeouts also help the server: an upstream timeout signal lets it abort long-running work and reclaim resources.

---

## 6. Observability and Standards

Monitor retry counts, circuit-breaker state transitions, and backoff delays so retry storms surface before they become outages. Tooling like OpenTelemetry unifies logs, traces, and metrics for this. Machine-readable error bodies (RFC 9457, `application/problem+json`) also let clients make smarter retry decisions from structured error data.

In summary: retry only transient failures, back off exponentially with jitter, honor `Retry-After`, make writes idempotent, and wrap it all in circuit breakers and explicit timeouts.
