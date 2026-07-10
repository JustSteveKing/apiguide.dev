---
title: "HTTP Caching (RFC 9111)"
description: "A reference guide to HTTP caching as defined in RFC 9111, covering freshness, validation, Cache-Control directives, the Vary header, shared versus private caches, and heuristic freshness."
currentVersion: "RFC 9111"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9111.html"
---

## What is HTTP Caching?

RFC 9111, HTTP Caching, defines how HTTP caches store and reuse responses to reduce latency and network load. A cache is any store of previous responses that can serve them again without contacting the origin server, and a well-behaved cache follows the rules in this specification to avoid serving stale or incorrect data.

Caching is one of the most effective ways to improve the performance and scalability of a web system. When a response can be reused, the client gets an answer faster and the origin server does less work. The challenge is knowing *when* a stored response is still usable, which is exactly what this specification governs.

Published in June 2022 as part of the HTTP core revision, it obsoletes the caching material previously contained in RFC 7234.

---

## Shared versus private caches

RFC 9111 distinguishes two kinds of cache, and several directives behave differently between them:

| Type    | Location                                   | Serves            |
| ------- | ------------------------------------------ | ----------------- |
| Private | A single user, for example a browser cache | One user only     |
| Shared  | Between origin and clients, for example a CDN or proxy | Many users |

The distinction matters for anything user-specific. A response marked `private` may be stored by a browser but must not be stored by a shared cache, preventing one user's personalized data from being served to another.

---

## Freshness

The primary mechanism is *freshness*. A stored response is fresh if its age has not exceeded its freshness lifetime, and a fresh response can be served without contacting the origin.

Freshness lifetime is determined, in order of precedence, by:

1. The `s-maxage` directive (shared caches only)
2. The `max-age` directive
3. The `Expires` header field (an absolute date)
4. A heuristic, if none of the above are present

The `Age` header field, added by caches, tells the client how long the response has been stored. Age is compared against the freshness lifetime to decide whether the response is still fresh.

```http
HTTP/1.1 200 OK
Date: Tue, 15 Jul 2026 09:00:00 GMT
Cache-Control: max-age=3600
Age: 120
Content-Type: application/json

{"temperature":21.5}
```

Here the response may be reused for 3600 seconds and has already been cached for 120, so it stays fresh for another 3480 seconds.

---

## Cache-Control directives

`Cache-Control` is the primary way to control caching. It carries one or more directives that apply to requests, responses, or both.

| Directive          | Applies to | Effect                                                        |
| ------------------ | ---------- | ------------------------------------------------------------- |
| `max-age=N`        | Both       | Freshness lifetime of N seconds                              |
| `s-maxage=N`       | Response   | Freshness lifetime for shared caches, overrides `max-age`    |
| `no-cache`         | Both       | May store, but must revalidate before reuse                  |
| `no-store`         | Both       | Must not store any part of the message                       |
| `private`          | Response   | Only a private cache may store the response                  |
| `public`           | Response   | May be stored even when it would not normally be cacheable   |
| `must-revalidate`  | Response   | Once stale, must revalidate; do not serve stale on error     |
| `proxy-revalidate` | Response   | Like `must-revalidate` but for shared caches only            |
| `immutable`        | Response   | The response body will not change during its freshness lifetime |

A common point of confusion: `no-cache` does not forbid storage. It requires revalidation with the origin before reuse. To prevent storage entirely, use `no-store`.

---

## Validation

When a stored response becomes stale, a cache does not have to discard it. Instead it can *validate* it with the origin using a conditional request. If the origin confirms the stored copy is still good, it returns `304 Not Modified` with no body, saving bandwidth.

Validation uses the validators defined in HTTP Semantics:

- `ETag` with `If-None-Match`
- `Last-Modified` with `If-Modified-Since`

```http
GET /styles.css HTTP/1.1
Host: cdn.example.com
If-None-Match: "v3-9f8a"
If-Modified-Since: Mon, 14 Jul 2026 12:00:00 GMT

HTTP/1.1 304 Not Modified
ETag: "v3-9f8a"
Cache-Control: max-age=86400
```

Entity-tags are preferred because they can detect any change, whereas `Last-Modified` has one-second resolution and can miss rapid edits. A `304` response also refreshes the stored response's freshness.

---

## The Vary header

A cache normally keys stored responses by the request URI. When a response was selected through content negotiation, the URI alone is not enough. The `Vary` header lists the request header fields that influenced the response, so the cache only reuses it for matching requests.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Vary: Accept-Encoding, Accept-Language
Cache-Control: max-age=600
```

This tells the cache to store separate variants per `Accept-Encoding` and `Accept-Language`. Using `Vary: *` indicates the response is effectively uncacheable by other requests, since anything could have influenced it.

---

## Heuristic freshness

When a response is cacheable but carries no explicit freshness information (no `max-age`, `s-maxage`, or `Expires`), a cache may compute a *heuristic* freshness lifetime. RFC 9111 permits this only when the status code is defined as heuristically cacheable, such as `200 OK`.

A common heuristic uses the `Last-Modified` date: the cache assumes a lifetime of roughly 10% of the time since the resource was last modified. When a cache serves a heuristically fresh response whose age exceeds 24 hours, it is expected to attach a `Warning` where applicable. To avoid unpredictable behavior, provide explicit `Cache-Control` directives rather than relying on heuristics.
