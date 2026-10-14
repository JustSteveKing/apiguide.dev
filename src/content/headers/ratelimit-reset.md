---
name: "RateLimit-Reset"
description: "Legacy field from early IETF drafts giving the seconds until the quota resets. Superseded by the t parameter of RateLimit."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Reset header?

The `RateLimit-Reset` response header gives the number of seconds until the quota in the current window resets. It comes from revisions -00 to -06 of the IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers`, where it was one of three fields with [`RateLimit-Limit`](/headers/ratelimit-limit) and [`RateLimit-Remaining`](/headers/ratelimit-remaining), modeled on the de facto `X-RateLimit-Reset`.

Revision -07 (June 2023) replaced the three fields with a single `RateLimit` field. In the current draft, the equivalent is the `t` parameter of [`RateLimit`](/headers/ratelimit): the effective window, in seconds, within which the client can use no more than the remaining quota. The current draft does not define `RateLimit-Reset`.

## API Usage & Best Practices

* **New APIs: use RateLimit instead**: Emit `RateLimit` with `t`, and describe the window itself with `w` in [`RateLimit-Policy`](/headers/ratelimit-policy).
* **Seconds from now, never a timestamp**: The draft field was a delay in seconds so it did not depend on synchronized clocks. The `X-RateLimit-Reset` convention it replaced is sent by different APIs as seconds, milliseconds, Unix timestamps or dates. If you are keeping `X-RateLimit-Reset` for existing clients, document which one you send; do not change its meaning under them.
* **Existing APIs: keep it while clients read it**: Send the current fields alongside the legacy one and retire it through your normal deprecation process.
* **Not a promise of a full refill**: Both the old and current drafts warn that the client must not assume its whole quota is restored when the timer hits zero, and that the server may change the value between requests, for example for sliding windows.
* **Add jitter, and keep Retry-After consistent**: If every client is told to come back at the same moment, they all will. On a [`429 Too Many Requests`](/status-codes/429), send [`Retry-After`](/headers/retry-after) as well; clients give it precedence.

## Examples

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 37
```

The current equivalent:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=0;t=37
```
