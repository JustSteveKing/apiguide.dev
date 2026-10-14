---
name: "RateLimit-Policy"
description: "Advertises the quota policies a server applies to the client, each named and described by quota, window and unit."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Policy header?

The `RateLimit-Policy` response header advertises the quota policies that apply to the client's requests. It is defined in the IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers` (revision -11 at the time of writing), alongside its companion field [`RateLimit`](/headers/ratelimit), which reports how much of each policy is left. It is not yet an RFC and is not yet in the IANA field name registry, so treat the details below as current draft text rather than settled standard.

The value is a [Structured Field](/specifications/structured-fields) List. Each item is a string naming the policy, followed by parameters:

| Parameter | Required | Meaning |
| :--- | :--- | :--- |
| `q` | Yes | The quota allocated by the policy, as a non-negative integer, in quota units. |
| `qu` | No | The quota unit, as a string: `"requests"` (the default), `"content-bytes"` or `"concurrent-requests"`. |
| `w` | No | The time window in seconds, as a positive integer. No sub-second precision. |
| `pk` | No | The partition key, as a byte sequence (`:base64:`), identifying which slice of capacity this quota belongs to. |

## API Usage & Best Practices

* **Static description, not live state**: The draft says the value should stay consistent across responses. It describes the rules ("100 requests per minute"), while `RateLimit` carries the changing numbers ("12 left, resets in 30 seconds"). Keep counters out of this field.
* **Name every policy**: The policy name is what ties a `RateLimit` item and the `violated-policies` member of a problem response back to a policy here. Pick short, stable names such as `"per-minute"` or `"daily"` and do not rename them casually.
* **Advertise layered limits together**: A burst limit and a daily cap are two items in one list. The draft recommends pairing a long-window policy with a short-window one, so a client cannot read a large daily quota as permission to spend it in seconds.
* **Prefix your own parameters**: Extra parameters are allowed and treated as comments, but the draft asks for a vendor prefix, such as `acme-burst`.
* **Informative only**: Clients may ignore this field, and nothing here is a service-level guarantee. Enforce limits on the server regardless of what you advertise.
* **Do not leak capacity**: Advertising per-tenant quotas to unauthenticated callers can tell an attacker how much load you can absorb. Scope what you expose to the caller's own partition.
* **Headers only**: The field must not be sent in a trailer section.

## Examples

A burst limit and a daily cap, both counted in requests:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "burst";q=100;w=60, "daily";q=1000;w=86400
RateLimit: "burst";r=42;t=37
```

A per-user bandwidth policy with a partition key and a non-default unit:

```http
HTTP/1.1 200 OK
RateLimit-Policy: "peruser";q=65535;qu="content-bytes";w=10;pk=:cHsdsRa894==:
```
