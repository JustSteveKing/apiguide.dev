---
title: "Conditional Requests & Validation"
description: "How to use ETag, Last-Modified, and precondition headers to enable 304 responses and prevent lost updates in HTTP APIs."
category: "caching"
---

## Introduction to Conditional Requests

Conditional requests let a client attach preconditions to an operation so the server only acts when the resource is in an expected state. Defined by RFC 7232 (and carried into RFC 9110), they solve two distinct problems: revalidating cached representations without transferring a full body, and preventing the "lost update" scenario when multiple clients modify the same resource. For API designers they are not optional optimizations but foundational tools for efficiency and data integrity.

---

## 1. Validators: ETag and Last-Modified

Conditional requests depend on **validators** — server-generated metadata describing a resource's current state.

### ETag (Entity Tag)
An [`ETag`](/headers/etag) is an opaque identifier for a specific version of a representation, typically a hash of the content or a version number. Its value must be enclosed in double quotes.

### Last-Modified
A [`Last-Modified`](/headers/last-modified) timestamp records when the origin server believes the representation last changed. It has one-second resolution, which limits precision for rapidly changing resources and generally makes it a weaker signal than a strong ETag.

Servers should send both headers for cacheable resources when they can, since some clients support only one.

---

## 2. Strong vs. Weak Validators

HTTP uses strong comparison by default.

* **Strong validators** change whenever the representation's bytes change, guaranteeing byte-for-byte identity. They are required for concurrency control and range requests.
* **Weak validators**, prefixed with `W/`, indicate semantic equivalence and may not change for trivial differences such as whitespace or reformatting. They are acceptable for cache revalidation where minor variations do not matter.

| | Strong ETag | Weak ETag (`W/`) | Last-Modified |
| --- | --- | --- | --- |
| Guarantees | Byte-for-byte | Semantic equivalence | Timestamp only |
| Resolution | Exact (byte-for-byte) | Semantic (ignores trivial changes) | One second |
| Concurrency control | Yes | No | Weaker |
| Cache revalidation | Yes | Yes | Yes |

---

## 3. Cache Revalidation with `304 Not Modified`

The most common use of conditional requests is revalidating a stale cached copy on a GET or HEAD.

The client stores validators from the first response and replays them on the next request:

```http
GET /v1/leads/42 HTTP/1.1
Host: api.apiguide.dev
If-None-Match: "8a9f0c2b"
If-Modified-Since: Wed, 25 Oct 2023 19:17:59 GMT
```

If the resource is unchanged, the server returns a body-less response:

```http
HTTP/1.1 304 Not Modified
ETag: "8a9f0c2b"
```

[`If-None-Match`](/headers/if-none-match) uses weak comparison and takes precedence over [`If-Modified-Since`](/headers/if-modified-since) when both are present. A [`304 Not Modified`](/status-codes/304) response carries no body, saving bandwidth and origin work. See the [caching guide](/guides/caching) for how this fits into the broader freshness model.

---

## 4. Concurrency Control with `If-Match` and `412`

For state-changing methods (PUT, PATCH, DELETE), conditional requests prevent one client from silently overwriting another's changes.

The client submits the ETag of the version it last read in an [`If-Match`](/headers/if-match) header, which uses strong comparison:

```http
PUT /v1/leads/42 HTTP/1.1
Host: api.apiguide.dev
If-Match: "8a9f0c2b"
Content-Type: application/json

{ "status": "qualified" }
```

If the current ETag still matches, the write proceeds. If another process already updated the resource, the ETag differs and the server rejects the request:

```http
HTTP/1.1 412 Precondition Failed
```

A [`412 Precondition Failed`](/status-codes/412) tells the client its copy is stale; it should re-fetch and retry. Some APIs also return `428 Precondition Required` when a mutating request omits `If-Match` entirely, forcing clients to opt into safe updates.

`If-Match: *` succeeds as long as any current representation exists — useful with PUT to prevent creating a resource that already exists.

---

## 5. Timestamp-Based Preconditions

Two headers mirror the ETag-based conditionals using dates instead of entity tags. All HTTP dates are expressed in GMT.

* **`If-Modified-Since`**: for GET/HEAD. The server returns the body only if the resource changed after the given date, otherwise `304`. Ideal for revalidating a cached entity that has no ETag.
* **`If-Unmodified-Since`**: for mutations. The request proceeds only if the resource has not changed since the given date, failing with `412` otherwise. It is the timestamp equivalent of `If-Match`.

---

## 6. Precedence Rules

When several precondition headers appear in one request, RFC 7232 defines a fixed evaluation order:

1. `If-Match` — if present, `If-Unmodified-Since` is ignored.
2. `If-Unmodified-Since`.
3. `If-None-Match` — if present, `If-Modified-Since` is ignored.
4. `If-Modified-Since`.

Because ETag-based conditionals take precedence over date-based ones, sending both a validator pair is safe: the stronger check wins.

---

## 7. Implementation Guidance

* **Generate ETags deterministically.** Hash a canonical serialization (for example, JSON with sorted keys) so identical content always yields the same tag. Storing precomputed ETags avoids regenerating a full representation just to answer a conditional GET.
* **Support conditional GETs everywhere.** Emit `ETag` and `Last-Modified` on all cacheable GET/HEAD endpoints and honor the matching conditionals. GitHub's REST API, for example, does not count `304` responses against the primary rate limit.
* **Require `If-Match` on mutations.** For PUT, PATCH, and DELETE, treat a missing precondition as a risk of lost updates.
* **Prefer standard headers.** Avoid inventing custom conditional headers for business logic; they undermine interoperability. See the [conditional requests](/guides/conditional-requests) patterns alongside the [HTTP caching specification](/specifications/http-caching) for the authoritative rules.
