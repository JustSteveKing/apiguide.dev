---
name: "RateLimit-Limit"
description: "Legacy field from early IETF drafts giving the request quota for the current window. Superseded by RateLimit and RateLimit-Policy."
category: "response"
standard: false
relatedCodes: [429]
reference:
  title: "Earlier revisions of draft-ietf-httpapi-ratelimit-headers"
  url: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
updatedDate: 2026-10-14
---

## What is the RateLimit-Limit header?

The `RateLimit-Limit` response header gives the quota, usually a number of requests, that the client is allowed in the current rate limit window. It comes from revisions -00 (December 2020) to -06 (December 2022) of the IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers`, where it was one of three fields alongside [`RateLimit-Remaining`](/headers/ratelimit-remaining) and [`RateLimit-Reset`](/headers/ratelimit-reset). Those three were a standardized take on the de facto `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` convention.

Revision -07 (June 2023) dropped all three in favor of a single `RateLimit` field, and later revisions reshaped that into the current design: [`RateLimit`](/headers/ratelimit) for the live remaining quota and [`RateLimit-Policy`](/headers/ratelimit-policy) for the quota and window, both keyed by policy name. The current draft does not define `RateLimit-Limit` at all. The policy's `q` parameter is its replacement.

## API Usage & Best Practices

* **New APIs: do not emit it**: Use `RateLimit-Policy` for the quota (`q`) and window (`w`), and `RateLimit` for what is left. They can describe several concurrent limits, such as a burst and a daily cap, which a single integer cannot.
* **Existing APIs: keep it while clients depend on it**: If published SDKs or customer integrations already read `RateLimit-Limit`, removing it is a breaking change. Emit the current fields alongside the legacy ones, document the legacy names as deprecated, and remove them on your normal deprecation schedule.
* **Keep the set consistent**: In the drafts that defined it, a response carrying `RateLimit-Limit` also had to carry `RateLimit-Reset`. If you still send the legacy trio, send all three with values that agree with each other and with the new fields.
* **It is not a standard**: Never cite it as an RFC or registered field. It was only ever an Internet-Draft name, and it is not in the IANA field name registry.

## Examples

A legacy response, as an existing client might expect it:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 37
```

The same state expressed with the current draft's fields, sent alongside during a migration:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=42;t=37
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 37
```
