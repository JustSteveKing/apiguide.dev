---
title: "CDN & Edge Caching for APIs"
description: "How to control shared caches with s-maxage, Vary, surrogate keys, and stale-while-revalidate to serve API responses from the edge."
category: "caching"
---

## Introduction to Edge Caching

CDN and edge caches sit between your origin and your clients, storing responses close to users to cut latency and offload the origin. For APIs this only works when responses carry precise instructions about how, where, and for how long they may be reused. HTTP caching for shared caches is governed primarily by RFC 9111, which supersedes RFC 7234 and defines the header fields that make edge caching predictable.

---

## 1. Shared vs. Private Caches

A cache is either **private** (dedicated to one user, such as a browser) or **shared** (serving many users, such as a CDN or reverse proxy). The distinction drives every caching decision for an API.

* Personalized or authenticated data must never land in a shared cache, or one user's response could be served to another.
* Public, non-personalized data benefits most from shared caching, since a single stored copy fans out to many clients.

Use [`Cache-Control`](/headers/cache-control) `private` for user-specific data and `public` for shared-cacheable data. Responses carrying an `Authorization` header are treated as private by default; `public` can override that when the content is genuinely safe to share.

---

## 2. Directives That Target the Edge

The [`Cache-Control`](/headers/cache-control) header carries the core directives. Two matter specifically for shared caches.

* **`max-age=<seconds>`**: freshness lifetime for any cache.
* **`s-maxage=<seconds>`**: freshness lifetime for shared caches only, overriding `max-age` at the CDN. This lets the edge hold content far longer than a browser would.
* **`no-cache`**: may be stored but must be revalidated before every reuse — it does not mean "do not store."
* **`no-store`**: must never be stored anywhere; reserve it for tokens and sensitive data.

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=60, s-maxage=86400
```

Here browsers treat the response as fresh for 60 seconds while the CDN holds it for a full day. Pair these with an [`ETag`](/headers/etag) so that when content does expire the edge can revalidate cheaply — see [conditional requests](/guides/conditional-requests) and the [caching guide](/guides/caching).

---

## 3. Stale-While-Revalidate

The `stale-while-revalidate` directive lets a cache return an expired response immediately while it revalidates with the origin in the background, hiding revalidation latency from the user.

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

Content is fresh for 60 seconds. For the next 300 seconds it is served stale while the edge refreshes it. Past 360 seconds total, the cache must revalidate before serving. This models three states — fresh, stale-but-usable, and expired — and suits data that changes occasionally but tolerates slight lag: profiles, catalogs, configuration. It is unsuitable for live inventory, auction prices, or session tokens. Modern browsers (Chrome 75+, Edge 79+, Safari 14+, Firefox 68+) and CDNs including Fastly, CloudFront, and Cloudflare support it.

---

## 4. The `Vary` Header

A cache keys stored responses on the request method and URI. When a resource has multiple representations, the [`Vary`](/headers/vary) header names the extra request headers the cache must include in that key.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Vary: Accept, Accept-Encoding
```

Without `Vary: Accept`, a cache might serve a JSON body to a client that asked for XML. Without `Vary: Accept-Encoding`, it might hand a gzip body to a client that cannot decode it.

The risk is cardinality. Varying on `User-Agent` (thousands of values) or `Cookie` (unique per user) fragments the cache so badly it stops working. Normalize first — collapse `User-Agent` into a `mobile`/`desktop` class and vary on that, and reduce `Accept-Encoding` to gzip-or-not. Never use `Vary: *`; prefer `Cache-Control: private` when a response truly must not be shared.

---

## 5. Surrogate Keys and Purging

Time-based expiry cannot react to a sudden data change. Surrogate keys give the edge targeted, near-instant invalidation. The origin tags a response with one or more keys:

```http
HTTP/1.1 200 OK
Surrogate-Key: products product-123 category-electronics
Cache-Control: public, s-maxage=86400
```

When product 123 changes, a single purge for `product-123` invalidates every cached object carrying that key across the edge network, overriding any remaining `s-maxage`. Purges run through the CDN's control panel or its purge API. **Soft purge** marks objects stale rather than deleting them, so they keep serving (like stale-while-revalidate) while a background refresh runs. Related CDN-specific headers such as `Surrogate-Control` set edge-only lifetimes independent of the browser's `max-age`.

---

## 6. Design Choices That Improve Cacheability

* **Keep resources granular.** Split a large resource so each part caches on its own lifecycle — separate invoice details from payment status rather than serving one blob.
* **Separate public from private.** Do not mix generic and user-specific fields in one representation; the private field forces the whole response out of shared caches.
* **Aim for a high hit ratio.** A healthy public API often targets around 90% edge hits; measure and tune toward it.

---

## 7. Pitfalls at the Edge

* **Leaking sensitive data.** Use `Cache-Control: private` for authenticated data and `no-store` for credentials and financial transactions.
* **Cache poisoning.** Never reflect unvalidated request input into a cached response; an attacker could inject content served to every subsequent user.
* **Cache stampede.** When a hot key expires, concurrent requests can swamp the origin. `stale-while-revalidate` mitigates this by letting one request revalidate while others receive stale content.
* **Consistency cost.** Distributed edge caches make invalidation genuinely hard. Lean on surrogate keys and see [cache invalidation](/guides/cache-invalidation) and [CDN edge caching](/guides/cdn-edge-caching) for deeper strategy, grounded in the [HTTP caching specification](/specifications/http-caching).
