---
title: "Asynchronous & Long-Running Operations"
description: "Handle long-running work in HTTP APIs with 202 Accepted, status polling endpoints, job resources, Retry-After, and the trade-off between polling and webhooks."
category: "core"
---

## Introduction to Asynchronous Operations

Some operations cannot complete within a single request/response cycle: video transcoding, report generation, bulk imports, or third-party provisioning. Holding a connection open for minutes is fragile, ties up server resources, and hits proxy timeouts.

The solution is to acknowledge the request immediately, do the work in the background, and give the client a way to learn the outcome later. HTTP has well-established patterns for exactly this.

---

## 1. 202 Accepted

When the server accepts work for later processing, it responds with [`202 Accepted`](/status-codes/202). This status explicitly means "the request is valid and queued, but not yet complete."

```http
POST /reports HTTP/1.1
Content-Type: application/json

{ "type": "annual-revenue", "year": 2025 }
```

```http
HTTP/1.1 202 Accepted
Location: /jobs/8f3a
Retry-After: 5
```

Two headers do the heavy lifting: `Location` points to a resource the client can poll, and `Retry-After` suggests how long to wait before checking.

---

## 2. Job Resources

Model the background task as a first-class **job resource** with its own URI and lifecycle. This makes progress observable and gives you somewhere to attach errors and results.

```http
GET /jobs/8f3a HTTP/1.1
```

```json
{
  "id": "8f3a",
  "status": "running",
  "progress": 0.6,
  "created_at": "2026-07-10T09:00:00Z"
}
```

Define a clear status enum and treat it as part of your contract: `queued`, `running`, `succeeded`, `failed`, and optionally `cancelled`.

---

## 3. Polling for Completion

The client polls the job resource until it reaches a terminal status. Honour `Retry-After` to avoid hammering the server, and use [caching](/guides/caching) headers so unchanged status responses stay cheap.

When the job succeeds, point the client to the result rather than inlining it. A [`303 See Other`](/status-codes/303) redirect to the finished resource is idiomatic:

```json
{
  "id": "8f3a",
  "status": "succeeded",
  "result": { "href": "/reports/8f3a/download" }
}
```

A failed job should return the error detail in the body (see [error handling](/guides/error-handling)) rather than making the poll itself fail.

---

## 4. Retry-After Semantics

`Retry-After` accepts either a number of seconds or an HTTP date. Use it consistently so clients can implement backoff without guessing.

| Situation | Suggested value |
| --- | --- |
| Job just queued | Short delay (a few seconds) |
| Job running, slow work | Longer delay, possibly increasing |
| Rate limited ([`429`](/status-codes/429)) | Time until the window resets |

Pair server-suggested delays with client-side exponential backoff and jitter, as covered in the [idempotency guide](/guides/idempotency).

---

## 5. Webhooks vs Polling

Polling is simple but wasteful; most polls return "still running." Webhooks invert the flow: the server calls the client when the job finishes.

| | Polling | Webhooks |
| --- | --- | --- |
| Complexity | Client only | Client needs a public endpoint |
| Latency | Bounded by poll interval | Near real-time |
| Wasted traffic | High | Minimal |
| Reliability | Client controls retries | Needs delivery retries + signing |

Offer both when you can: webhooks for efficiency, polling as a fallback for clients that cannot expose an endpoint. See the [webhooks guide](/guides/webhooks) for signing and delivery guarantees.

---

## 6. The Prefer Header

The `Prefer: respond-async` request header (RFC 7240) lets a client explicitly ask for asynchronous handling of an operation that *could* run synchronously. The server confirms with `Preference-Applied: respond-async` and returns `202`.

```http
POST /imports HTTP/1.1
Prefer: respond-async, wait=10
```

The optional `wait` parameter asks the server to attempt synchronous completion for up to N seconds before falling back to async. This gives clients a single endpoint that adapts to how long the work actually takes, rather than forcing separate sync and async APIs.
