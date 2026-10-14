---
name: "RateLimit"
description: "Reports the quota currently available to the client under each named rate limit policy, and how long that quota applies."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit header?

The `RateLimit` response header reports the client's current service limit: how much quota is available under a named policy, and the window within which that quota applies. It is defined in the IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers` (revision -11 at the time of writing) together with [`RateLimit-Policy`](/headers/ratelimit-policy), which describes the policies themselves. It is not yet an RFC and is not yet in the IANA field name registry.

The value is a [Structured Field](/specifications/structured-fields) List. Each item is a string naming a policy, followed by parameters:

| Parameter | Required | Meaning |
| :--- | :--- | :--- |
| `r` | Yes | The remaining (available) quota under that policy, as a non-negative integer, in quota units. |
| `t` | No | The effective window: seconds within which the client can use no more than `r`. A delay in seconds, not a timestamp. |
| `pk` | No | The partition key, as a byte sequence (`:base64:`). |

This single field replaces the separate `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` fields from early revisions of the same draft. See [`RateLimit-Limit`](/headers/ratelimit-limit) for that history.

## API Usage & Best Practices

* **Use this for new APIs**: If you are designing rate limit headers today, emit `RateLimit` and `RateLimit-Policy`, not `X-RateLimit-*` or the three legacy `RateLimit-*` fields. The draft's own survey of the `X-RateLimit-*` convention found reset values sent as seconds, milliseconds, Unix timestamps and dates; `t` is always seconds from now.
* **Send it on successful responses too**: The point is to let clients slow down before they hit [`429 Too Many Requests`](/status-codes/429). The draft lets servers send it on any status code, and lets them send it only when a quota is close to exhaustion if header size matters.
* **Seconds, not timestamps**: `t` is a delay so it does not depend on client and server clocks agreeing. Add some jitter to it: if every client is told the quota resets at the same instant, they all come back at that instant.
* **Retry-After wins**: When a response carries both [`Retry-After`](/headers/retry-after) and `RateLimit`, clients must give `Retry-After` precedence, and servers should not set `Retry-After` earlier than the end of the effective window. On a `429`, send both and keep them consistent.
* **Hints, not guarantees**: A positive `r` does not promise the next request will succeed, and the server may lower values at any time, for example under attack or resource saturation. Clients must ignore malformed values and must not assume every response will carry the field.
* **Ignore it on cached responses**: The draft says clients should ignore `RateLimit` on a response served from cache (positive age), because the numbers are stale.
* **Pair with a problem type on 429**: The draft defines a `quota-exceeded` problem type whose `violated-policies` member lists the policy names that were exceeded. See [Quota Exceeded](/errors/quota-exceeded) and [Rate Limit Exceeded](/errors/rate-limit-exceeded).

## Examples

Forty-two requests left under the `"burst"` policy for the next 37 seconds:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "burst";q=100;w=60, "daily";q=1000;w=86400
RateLimit: "burst";r=42;t=37
```

The client has run out:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Policy: "burst";q=100;w=60, "daily";q=1000;w=86400
RateLimit: "burst";r=0;t=37
```
