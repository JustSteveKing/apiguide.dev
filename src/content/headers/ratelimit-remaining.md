---
name: "RateLimit-Remaining"
description: "Legacy field from early IETF drafts giving the quota left in the current window. Superseded by the r parameter of RateLimit."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Remaining header?

The `RateLimit-Remaining` response header gives the quota the client has left in the current rate limit window, as a non-negative integer. It comes from revisions -00 to -06 of the IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers`, where it sat alongside [`RateLimit-Limit`](/headers/ratelimit-limit) and [`RateLimit-Reset`](/headers/ratelimit-reset) as a standardized version of the de facto `X-RateLimit-Remaining`.

Revision -07 (June 2023) replaced the three fields with a single `RateLimit` field. In the current draft, remaining quota is the `r` parameter of the [`RateLimit`](/headers/ratelimit) field, reported per named policy from [`RateLimit-Policy`](/headers/ratelimit-policy). The current draft does not define `RateLimit-Remaining`.

## API Usage & Best Practices

* **New APIs: use RateLimit instead**: `RateLimit: "default";r=42;t=37` carries the remaining quota and the window it applies to in one field, and it can report several policies at once.
* **Existing APIs: keep sending it while clients read it**: Dropping a header clients depend on is a breaking change. Send the current fields alongside it and retire the legacy name through a documented deprecation.
* **Send it on every response, not only on 429**: Whichever name you use, the value is only useful if clients see it before they are throttled, so include it on successful responses too.
* **A positive value is not a promise**: Both the old and current drafts are explicit that remaining quota is a hint. The server can still throttle a client with quota left, for example under resource saturation.

## Examples

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 37
```

The current equivalent:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=42;t=37
```
