---
title: "Idempotency & Request Retries"
description: "How to implement idempotency keys, Redis-based locking, and safe client retry logic."
category: "core"
---

## Introduction to Idempotency

An API operation is idempotent if making the same request multiple times yields the same result and server state. While HTTP `GET`, `PUT`, and `DELETE` are natively idempotent, `POST` (typically used for billing, messaging, or resource creation) is not.

To prevent duplicate actions due to network interruptions, APIs must support idempotency keys.

---

## 1. Idempotency Keys Workflow

Clients send a unique identifier (usually a UUID) in the `Idempotency-Key` request header.

### Server Execution Flow:
1. **Receive Request**: Check if the `Idempotency-Key` exists in cache (e.g., Redis).
2. **First Time Seeing Key**: Save a lock record `processing` in Redis and execute the database transaction.
3. **Locking Concurrent Calls**: If a second request arrives with the same key while the first is running, return a `409 Conflict`.
4. **Cache the Result**: Once the transaction completes, save the HTTP status code and response body in Redis alongside the key, setting a TTL (e.g. 24 hours).
5. **Replays**: If the client calls again with the same key after completion, bypass the database, load the cached response from Redis, and return it instantly.

---

## 2. Request Retries & Jitter

When API clients experience network timeouts or receive `429` or `503` codes, they will attempt to retry the request. To prevent hammering the server, client libraries should implement **Exponential Backoff with Jitter**.

### Algorithm:
* **Exponential Backoff**: Multiply the wait time exponentially for each failure (e.g. 1s, 2s, 4s, 8s).
* **Jitter (Randomness)**: Add random variation to the wait time. Without jitter, all clients retrying a downed service will backoff and strike the service at the exact same synchronized intervals, creating a "thundering herd" effect.

```
sleep = random_between(0, base * (factor ^ attempt))
```
