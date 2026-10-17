---
title: "API Rate Limiting"
description: "How token bucket, sliding window, and fixed window algorithms work, and how to communicate limits with headers."
category: "reliability"
updatedDate: 2026-10-14
---

## Introduction to Rate Limiting

Rate limiting protects an API from being overwhelmed by too many requests in a given time window, whether from a runaway client, a misbehaving script, or a deliberate abuse attempt. Without it, a small number of heavy clients can degrade service for everyone else sharing the same infrastructure.

A good rate limiting strategy does two things: it enforces a limit fairly, and it communicates that limit clearly enough that well-behaved clients can adapt before they get blocked.

---

## 1. Rate Limiting Algorithms

### Fixed Window
Requests are counted within a fixed clock interval (e.g. 00:00-00:59). Once the counter hits the limit, further requests are rejected until the window resets.
* **Pros**: Simple to implement and reason about.
* **Cons**: Bursty at window boundaries. A client can send a full window's worth of requests at 00:59 and another full window's worth at 01:00, doubling the effective rate for a brief moment.

### Sliding Window
Instead of resetting all at once, the window continuously moves with the current time, usually approximated by weighting the previous window's count against how much of it overlaps the current one.
* **Pros**: Smooths out the boundary-burst problem of fixed windows.
* **Cons**: More computation and state to maintain than a fixed window counter.

### Token Bucket
Each client (or key) has a bucket that holds a fixed number of tokens. Tokens are consumed per request and refilled at a steady rate over time. If the bucket is empty, the request is rejected.
* **Pros**: Naturally allows short bursts up to the bucket size while still enforcing a steady average rate; widely used because it maps cleanly onto both simple in-memory counters and distributed caches like Redis.
* **Cons**: Requires tracking a refill timestamp per bucket, and tuning bucket size vs. refill rate takes some care to get the burst allowance right.

---

## 2. Communicating Limits with Headers

Clients should never have to guess how close they are to a limit. The IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers` defines two fields that expose the limit on every response, not just when it's exceeded. It is still a draft, so check the current revision before you depend on details:

* **[`RateLimit-Policy`](/headers/ratelimit-policy)**: The policies that apply, each named and given a quota (`q`) and a window in seconds (`w`). This describes the rules and should stay stable across responses.
* **[`RateLimit`](/headers/ratelimit)**: The live state per policy: the remaining quota (`r`) and the seconds within which it applies (`t`).

```http
HTTP/1.1 200 OK
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=42;t=37
```

Earlier revisions of the draft used three separate fields, [`RateLimit-Limit`](/headers/ratelimit-limit), [`RateLimit-Remaining`](/headers/ratelimit-remaining) and [`RateLimit-Reset`](/headers/ratelimit-reset), modeled on the older `X-RateLimit-*` convention. Use `RateLimit` and `RateLimit-Policy` for new APIs; keep the legacy names only while existing clients still read them.

When a client does exceed the limit, the response should also include [`Retry-After`](/headers/retry-after), telling the client exactly how long to wait before trying again rather than leaving it to guess and retry immediately. Clients give `Retry-After` precedence, so keep it no earlier than the end of the `t` window:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=0;t=37
```

---

## 3. Scoping: Per-Key, Per-IP, Per-Endpoint

A single global limit rarely fits every situation. Limits are usually applied at one or more of these scopes:

* **Per-API-key**: The most common scope for authenticated APIs, where each customer's key has its own bucket, so one customer's usage never affects another's.
* **Per-IP**: Useful as a fallback for unauthenticated endpoints (like login or signup) where there's no API key yet to key the limit on, but IPs can be shared by many users behind NAT or a corporate proxy, so it's a blunter instrument.
* **Per-endpoint**: Expensive or sensitive operations (bulk exports, search, password reset) often need a tighter limit than cheap reads, independent of the client's overall quota.

Production systems frequently combine scopes, for example a generous per-key limit for all traffic alongside a much stricter per-key-per-endpoint limit on a specific expensive route.

---

## 4. 429 vs. 503: Whose Fault Is It?

It's worth being precise about which status code a rate limiter should return, because the two options signal very different things to the client:

* **[`429 Too Many Requests`](/status-codes/429)**: The client has exceeded its own allotted quota. The server is healthy; this specific client just needs to slow down. This is the correct response for key-, IP-, or endpoint-scoped limits.
* **[`503 Service Unavailable`](/status-codes/503)**: The system as a whole is overloaded or shedding load, independent of any individual client's behavior. This applies when a server is protecting itself from aggregate load, for instance admission control during a traffic spike, rather than enforcing a per-client quota.

Both responses should include `Retry-After` so the client knows how long to back off, but conflating the two makes it harder for clients to distinguish "you personally need to slow down" from "the whole system is struggling right now," which matters when they're deciding whether to retry the same client differently than others.

A short window that protects capacity and a plan allowance that runs for a whole billing period are both `429`, but the client must react to them differently: back off and retry in seconds, or stop and tell a human. Tell them apart with the problem `type`, using [rate limit exceeded](/errors/rate-limit-exceeded) for the first and [quota exceeded](/errors/quota-exceeded) for the second. [Quotas and metering](/guides/quotas-metering) covers the billing-period side.
