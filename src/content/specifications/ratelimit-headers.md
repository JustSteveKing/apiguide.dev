---
title: "RateLimit Header Fields (Internet-Draft)"
description: "A reference for draft-ietf-httpapi-ratelimit-headers, the IETF HTTPAPI draft that defines the RateLimit and RateLimit-Policy fields, quota units, partition keys and rate limit problem types. An active Internet-Draft, not yet an RFC."
currentVersion: "draft-ietf-httpapi-ratelimit-headers-11"
officialUrl: "https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/"
---

## What are the RateLimit header fields?

Almost every public API rate limits, and almost every one reports it differently. The `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` convention looks like a standard but is not one: providers send the reset as seconds from now, milliseconds, a Unix timestamp or an HTTP date, and a client library cannot tell which without reading each provider's documentation.

`draft-ietf-httpapi-ratelimit-headers` is the IETF HTTPAPI working group's attempt to fix that with two [Structured Fields](/specifications/structured-fields): [`RateLimit-Policy`](/headers/ratelimit-policy), which describes the quota policies that apply, and [`RateLimit`](/headers/ratelimit), which reports how much quota is left under each.

**Status as of October 2026:** revision -11, dated 23 May 2026, is an active Internet-Draft adopted by the working group (WG state "WG Document", IESG state "I-D Exists"), intended for the Standards Track. It expires on 24 November 2026 unless a new revision is posted. It is not an RFC and the fields are not yet in the IANA field name registry. Field syntax has changed between revisions before, so pin your implementation to a revision and say which one in your documentation.

Even as a draft, it is the right shape to adopt for a new API. It is better specified than any of the `X-` conventions, and the parts most likely to change are the details, not the model.

---

## 1. RateLimit-Policy

`RateLimit-Policy` is a List. Each item is a String naming a policy, with parameters:

| Parameter | Required | Type | Meaning |
| :--- | :--- | :--- | :--- |
| `q` | Yes | Integer | The quota the policy allocates, in quota units |
| `qu` | No | String | The quota unit. Defaults to `"requests"` |
| `w` | No | Integer | The window, in seconds. Non-zero, no sub-second precision |
| `pk` | No | Byte Sequence | The partition key the quota is allocated per |

```http
RateLimit-Policy: "burst";q=100;w=60,"daily";q=1000;w=86400
```

The draft defines three quota units: `requests`, `content-bytes` and `concurrent-requests`. A byte-based policy looks like this:

```http
RateLimit-Policy: "peruser";q=65535;qu="content-bytes";w=10;pk=:sdfjLJUOUH==:
```

Policy details are informative. Clients may ignore `RateLimit-Policy` entirely and work from `RateLimit` alone, which is why the policy names should stay stable across responses: they are how a client correlates the two fields.

---

## 2. RateLimit

`RateLimit` is a List of the current service limits, one item per policy:

| Parameter | Required | Type | Meaning |
| :--- | :--- | :--- | :--- |
| `r` | Yes | Integer | The quota remaining under the named policy, in its quota units |
| `t` | No | Integer | The effective window: seconds within which the client may use no more than `r` |
| `pk` | No | Byte Sequence | The partition key |

```http
HTTP/1.1 200 OK
RateLimit-Policy: "default";q=100;w=10
RateLimit: "default";r=50;t=30
```

`t` is a delay in seconds, never a timestamp. That is the single most important decision in the draft: it removes any dependence on the client and server clocks agreeing, and it removes the "is this seconds or milliseconds" ambiguity the `X-` convention never resolved.

Neither field may appear in a trailer. Both may be split across multiple field lines.

---

## 3. On a 429, and with Retry-After

The fields can appear on any response, not only a throttled one, and they are most useful on successful responses: the point is to let a client slow down before it hits [`429 Too Many Requests`](/status-codes/429).

When the limit is hit, send both [`Retry-After`](/headers/retry-after) and `RateLimit`, and keep them consistent:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 5
RateLimit: "default";r=0;t=5

{
  "type": "https://iana.org/assignments/http-problem-types#quota-exceeded",
  "title": "Request quota exceeded",
  "status": 429,
  "violated-policies": ["default"]
}
```

| Rule | Who | Requirement |
| :--- | :--- | :--- |
| Precedence | Client | `Retry-After` wins when both are present; the effective window may be ignored |
| Consistency | Server | `Retry-After` should not point earlier than the end of the effective window |
| Redirects | Server | Take care sending a low `r` on a `3xx`: it can stop the client following the redirect |

---

## 4. Problem types

The draft proposes three problem types for [Problem Details](/specifications/problem-details) responses, each carrying a `violated-policies` extension member listing the policy names involved:

| Problem type | Status | Meaning |
| :--- | :--- | :--- |
| `quota-exceeded` | 429 | The client exceeded one or more quota policies |
| `temporary-reduced-capacity` | 503 | The server is temporarily serving reduced quota; it may send a `RateLimit-Policy` with the lower values |
| `abnormal-usage-detected` | 429 | The request pattern looks unintentional or malicious |

The draft's type URIs sit under `https://iana.org/assignments/http-problem-types#`. Until the draft is published and IANA registers them, they are proposals. See [Quota Exceeded](/errors/quota-exceeded) for how this site treats the first one.

---

## 5. Client and intermediary rules

* **Hints, not guarantees.** A positive `r` does not promise the next request will succeed. The server can lower values at any time, under attack or saturation for example. Servers must still protect themselves; the fields do not prevent anything.
* **Ignore what you cannot parse.** Clients must ignore malformed fields and must not assume every response carries them.
* **Ignore stale values.** On a response served from cache with a positive age, the numbers are out of date and clients should ignore them.
* **Intermediaries must not loosen.** A proxy should not alter the fields to advertise a more permissive policy, including by stripping them. It may make them stricter only if it understands the units and enforces the stricter policy.
* **Add jitter.** If every client is told the window ends at the same moment, they all come back at that moment.
* **Cap the implied rate.** A large `r` over a long `t` can imply a burst far above what the policy really allows. Servers should cap the ratio; clients should treat an absurd window as a reason to be conservative.

---

## 6. The older RateLimit-Limit, -Remaining and -Reset fields

Revisions -00 to -06 defined three separate fields, [`RateLimit-Limit`](/headers/ratelimit-limit), [`RateLimit-Remaining`](/headers/ratelimit-remaining) and [`RateLimit-Reset`](/headers/ratelimit-reset), modeled on the `X-` convention. Later revisions replaced them with the single `RateLimit` field plus `RateLimit-Policy`. The new form names each policy, so one response can report several quotas at once, which the three-field form had no clean way to do.

Plenty of gateways and libraries still emit the three-field form. Do not build anything new on it. If you have clients that read it, emit both forms during a migration period, then drop the old fields on a published date.

For designing the limits themselves see [rate limiting](/guides/rate-limiting); for billing-grade quotas see [quotas and metering](/guides/quotas-metering).
