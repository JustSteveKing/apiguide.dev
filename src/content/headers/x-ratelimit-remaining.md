---
name: "X-RateLimit-Remaining"
description: "De facto header giving the requests left in the current rate limit window. Never standardized; superseded by the r parameter of RateLimit."
category: "response"
standard: false
relatedCodes: [403, 429]
---

## What is the X-RateLimit-Remaining header?

`X-RateLimit-Remaining` reports how many requests (or other quota units) the client has left in the current rate limit window. It is one of the de facto trio with [`X-RateLimit-Limit`](/headers/x-ratelimit-limit) and [`X-RateLimit-Reset`](/headers/x-ratelimit-reset). It has never been standardized and is not in the IANA HTTP Field Name Registry.

The IETF draft `draft-ietf-httpapi-ratelimit-headers` first standardized it as [`RateLimit-Remaining`](/headers/ratelimit-remaining) and now carries the same number as the `r` parameter of [`RateLimit`](/headers/ratelimit), tied to a named policy in [`RateLimit-Policy`](/headers/ratelimit-policy).

## API Usage & Best Practices

* **It is the field clients actually pace on.** A well-behaved client watches `X-RateLimit-Remaining` fall and slows down before it reaches zero, instead of discovering the limit through a [`429 Too Many Requests`](/status-codes/429). Send it on successful responses, not only on rejections, or it cannot do that.
* **Make it true across your fleet.** If each gateway node counts separately, the value is each node's share, and a client that reads `40` can still be rejected by the next node it reaches. [Tyk](/tools/gateways-management/tyk) has exactly this behavior with its default distributed limiter. Count in a shared store, or document that the number is approximate.
* **Report the tightest limit.** With several limits in force (per second and per day, say), a single integer can only describe one. Report the one closest to exhaustion; better, emit `RateLimit` and `RateLimit-Policy`, which report each limit by name.
* **A positive value is a hint, not a promise.** The server may still reject a request with quota left, under load or because a different limit applies. Clients must handle a 429 regardless of what the header said.
* **Clients: zero means wait for the reset, not retry now.** When it reaches `0`, wait until the time given by `X-RateLimit-Reset` (in whatever format that API uses) or by [`Retry-After`](/headers/retry-after) if present. If both are present, follow `Retry-After`, as the IETF draft requires for its own fields.
* **Clients: check the response is fresh.** A value from a cached response is stale. The IETF draft tells clients to ignore `RateLimit` on cached responses, and the same reasoning applies to the `X-` form.
* **New APIs: use `RateLimit` instead.** `RateLimit: "default";r=42;t=37` carries the remaining count and the window it applies to in one field.

## Examples

A client with 42 requests left in the current window:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 37
```

The client has run out. `Retry-After` tells it exactly how long to wait:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 37
```

The current IETF equivalent of the first response:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=42;t=37
```
