---
name: "X-RateLimit-Limit"
description: "De facto header giving the request quota for the current rate limit window. Never standardized; its meaning varies by API."
category: "response"
standard: false
relatedCodes: [403, 429]
updatedDate: 2026-10-17
---

## What is the X-RateLimit-Limit header?

`X-RateLimit-Limit` is the most widely copied of the three `X-RateLimit-*` response headers, alongside [`X-RateLimit-Remaining`](/headers/x-ratelimit-remaining) and [`X-RateLimit-Reset`](/headers/x-ratelimit-reset). It states the maximum number of requests (or other quota units) the client may make in the current window. No specification has ever defined it, it is not in the IANA HTTP Field Name Registry, and the window it refers to is whatever the API says it is.

The convention is the ancestor of the IETF rate limit fields. Early revisions of `draft-ietf-httpapi-ratelimit-headers` standardized it as [`RateLimit-Limit`](/headers/ratelimit-limit) without the prefix; the current draft replaces the whole trio with [`RateLimit-Policy`](/headers/ratelimit-policy), where `q` is the quota and `w` the window, and [`RateLimit`](/headers/ratelimit) for what remains. The draft's own survey of the `X-` convention found the field names themselves varying: per-window variants such as `x-ratelimit-limit-hour`, and `X-Rate-Limit-*` spellings with an extra hyphen.

How one widely used API defines it, as an illustration of how much is left to the vendor: GitHub's REST API sends `x-ratelimit-limit` as the maximum requests per hour, adds `x-ratelimit-used` and `x-ratelimit-resource` (which limit the request counted against), and returns either `403` or `429` when the limit is exceeded.

| `X-RateLimit-*` | Legacy IETF draft | Current IETF draft |
| :--- | :--- | :--- |
| `X-RateLimit-Limit` | `RateLimit-Limit` | `q` in `RateLimit-Policy` |
| `X-RateLimit-Remaining` | `RateLimit-Remaining` | `r` in `RateLimit` |
| `X-RateLimit-Reset` | `RateLimit-Reset` | `t` in `RateLimit` |

## API Usage & Best Practices

* **New APIs: emit `RateLimit` and `RateLimit-Policy` instead.** They name each policy, carry the window explicitly, and can describe a burst limit and a daily cap at once. A bare `X-RateLimit-Limit: 5000` cannot say which window it means, and if you have two limits you have to pick one to report.
* **Existing APIs: keep it, and add the IETF fields alongside.** Removing a header SDKs read is a breaking change. Send both sets with consistent values, mark the `X-` names deprecated in your docs, and retire them through your normal [deprecation process](/guides/deprecation-sunsetting).
* **Document the window.** If you send `X-RateLimit-Limit`, state in your API reference what period it covers and what counts against it (requests, points, bytes). A number without a window gives clients no way to pace themselves.
* **Clients: do not assume a meaning across APIs.** The limit may be per second, per hour or per day, per token or per IP, and some APIs report quota (a monthly allowance) under the same name others use for a rate limit: [Tyk](/tools/gateways-management/tyk), for one, reports quota data in its `X-RateLimit-*` headers by default. Read the vendor's docs, and if your client talks to several APIs, write one adapter per vendor that normalizes into a common shape, ideally the IETF one.
* **Clients: prefer the IETF fields when both are present.** If a response carries `RateLimit-Policy` as well as `X-RateLimit-Limit`, read the IETF field. It is the one with defined semantics.
* **Keep the limit stable.** The field describes a policy, not live state. If its value changes from request to request, clients cannot plan, and you probably mean `X-RateLimit-Remaining`.

## Examples

A legacy response, as many existing clients expect it:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4987
X-RateLimit-Reset: 1792252800
```

The same state during a migration, with the IETF fields alongside. The legacy reset is a Unix timestamp; the IETF `t` is seconds from now:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "hourly";q=5000;w=3600
RateLimit: "hourly";r=4987;t=1840
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4987
X-RateLimit-Reset: 1792252800
```
