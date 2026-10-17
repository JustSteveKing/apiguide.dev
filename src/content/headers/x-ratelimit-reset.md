---
name: "X-RateLimit-Reset"
description: "De facto header saying when the rate limit window resets. Sent as seconds, milliseconds, a Unix timestamp or a date, depending on the API."
category: "response"
standard: false
relatedCodes: [403, 429]
---

## What is the X-RateLimit-Reset header?

`X-RateLimit-Reset` tells the client when the current rate limit window ends and its quota is replenished. It completes the de facto trio with [`X-RateLimit-Limit`](/headers/x-ratelimit-limit) and [`X-RateLimit-Remaining`](/headers/x-ratelimit-remaining). It has never been standardized, is not in the IANA HTTP Field Name Registry, and of the three it is the one whose format varies most.

The IETF draft `draft-ietf-httpapi-ratelimit-headers` surveyed the `X-RateLimit-*` convention and lists four ways implementations express the time until the window expires: seconds remaining, milliseconds remaining, seconds since the Unix epoch, and a date (IMF-fixdate or RFC 3339). GitHub's REST API, for example, sends `x-ratelimit-reset` as UTC epoch seconds. The draft's own answer was a delay in seconds: first as [`RateLimit-Reset`](/headers/ratelimit-reset), now as the `t` parameter of [`RateLimit`](/headers/ratelimit), which does not depend on client and server clocks agreeing.

| Format | Example value | Meaning |
| :--- | :--- | :--- |
| Delta seconds | `37` | Resets 37 seconds from now |
| Delta milliseconds | `37000` | Resets 37 seconds from now |
| Unix timestamp | `1792252800` | Resets at 2026-10-17T16:00:00Z |
| Date | `Sat, 17 Oct 2026 16:00:00 GMT` | Resets at that instant |

## API Usage & Best Practices

* **Servers: send a delay in seconds if you are choosing now.** A delta has no clock skew problem and matches both `Retry-After` and the IETF `t`. Better still, emit `RateLimit` and `RateLimit-Policy` for new APIs and leave the `X-` names to existing clients.
* **Servers: never change the format under existing clients.** If you already send epoch seconds, keep sending epoch seconds. Switching to a delta silently turns every client's wait into a nonsense value. Document the format explicitly in your API reference.
* **Clients: read the vendor's docs, then guard with a sanity check.** If you must handle an unknown API, magnitude is a reasonable tiebreaker: a Unix timestamp in seconds is currently a 10-digit number and one in milliseconds is 13 digits, while a real reset delay is far smaller. Compare a timestamp against the response's [`Date`](/headers/date) header rather than your local clock, which may be wrong.
* **Clients: cap the wait.** A misread format can turn into a wait of decades or a wait of zero. Clamp the computed delay to a sane maximum and fall back to exponential backoff with jitter if the value is missing or absurd. See [retries and backoff](/guides/retries-backoff).
* **Clients: `Retry-After` wins.** On a [`429 Too Many Requests`](/status-codes/429) that carries [`Retry-After`](/headers/retry-after), wait for that rather than the reset time. The IETF draft makes this precedence explicit for its own fields.
* **Do not expect a full refill.** A reset time says when the current window ends, not that the whole quota will be free. With sliding windows or token buckets, quota returns gradually. The IETF drafts warn clients not to assume the full quota is restored.
* **Add jitter.** If every client waits for the same reset instant, they all return at that instant and trip the limit again. Spread retries over a few seconds after the reset.

## Examples

Epoch seconds, as GitHub sends it. The client works out the wait by comparing against `Date`:

```http
HTTP/1.1 403 Forbidden
Date: Sat, 17 Oct 2026 15:29:20 GMT
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1792252800
```

A delay in seconds, with `Retry-After` agreeing:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 37
```

The current IETF equivalent of the second response:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=0;t=37
```
