---
title: "Cache Invalidation Strategies"
description: "A practical comparison of TTL, event-based, tag-based, and versioned invalidation, plus stale-while-revalidate and stale-if-error."
category: "caching"
---

## Introduction to Cache Invalidation

Cache invalidation is the discipline of removing or refreshing cached data once it no longer reflects the source of truth. For HTTP APIs it means balancing three competing goals — performance, scalability, and freshness — across several cache layers: the browser, the CDN edge, a reverse proxy, an application cache like Redis, and the database query cache. No single technique fits every layer, so effective systems combine standardized HTTP mechanisms with application-level strategies. RFC 9111 defines the HTTP foundation.

---

## 1. Time-to-Live (TTL) Invalidation

The simplest model: give each response a lifetime and let it expire.

The `max-age` directive on [`Cache-Control`](/headers/cache-control) sets that lifetime in seconds from generation. While a response's age is below `max-age` it is fresh; after that it is stale.

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600
```

For shared caches, `s-maxage` overrides `max-age`, letting a CDN hold content longer than a browser. The legacy [`Expires`](/headers/expires) header sets an absolute date but is prone to clock-skew problems, so `max-age` is preferred. TTL is predictable and trivial to implement, but it always trades freshness against hit rate: too long serves stale data, too short wastes the cache.

---

## 2. Conditional Revalidation

When a TTL expires, the cache does not have to re-download everything. It can ask the origin whether anything changed using validators.

* [`ETag`](/headers/etag) + [`If-None-Match`](/headers/if-none-match): the server returns [`304 Not Modified`](/status-codes/304) if the tag still matches.
* [`Last-Modified`](/headers/last-modified) + [`If-Modified-Since`](/headers/if-modified-since): a `304` if the resource is unchanged since that date.

This turns an expensive full transfer into a cheap check. The [`Vary`](/headers/vary) header keeps representations separate when responses differ by request headers such as `Accept-Language`. See [conditional requests](/guides/conditional-requests) for the full mechanism.

---

## 3. Serving Stale: `stale-while-revalidate` and `stale-if-error`

RFC 5861 adds two directives that let a cache serve stale content deliberately.

* **`stale-while-revalidate`** serves a stale response immediately while refreshing in the background, hiding revalidation latency.
* **`stale-if-error`** serves stale content when the origin is unreachable or returns a 5xx error, improving resilience during outages.

```http
HTTP/1.1 200 OK
Cache-Control: max-age=3600, stale-while-revalidate=600, stale-if-error=86400
```

This response is fresh for one hour, then served stale for up to 10 minutes while revalidating, and — if the origin fails — kept serving for up to 24 hours. CDNs including Amazon CloudFront and Cloudflare support both directives.

---

## 4. Event-Based Invalidation

Rather than waiting for a timer, event-based invalidation reacts to actual data changes for near real-time consistency. When the source system writes an update, it emits an event — over Kafka, RabbitMQ, Redis Pub/Sub, or a webhook — and cache listeners evict or refresh the affected entries.

The payoff can be dramatic. EVE Online moved its skills endpoints from time-based to event-driven invalidation and saw the cache hit ratio jump from around 1% to over 90%, because entries were only evicted when data genuinely changed. The trade-off is operational complexity and the need for reliable delivery, so a durable at-least-once queue usually backs the event stream.

---

## 5. Tag / Key-Based Purging

Tag-based invalidation groups related cache entries under semantic tags so they can be cleared together without knowing every key.

```http
HTTP/1.1 200 OK
Surrogate-Key: product:123 category:electronics
```

When a change occurs, purging the tag `product:123` invalidates every object carrying it across distributed caches. Fastly implements this with `Surrogate-Key` headers and propagates purges globally in roughly 150 ms; Amazon CloudFront supports native tag invalidation via API calls (path-based invalidation there typically takes 10–60 seconds). Common implementations use a tag registry mapping tags to keys, or version tokens embedded in the key. Entity-level tags give precise control at the cost of many tag sets; type-level tags are simpler but over-invalidate.

---

## 6. Versioned URLs and Cache Keys

Embedding a version identifier in the URL or cache key makes each version a distinct entry, so new content is fetched automatically and old entries simply age out.

```http
GET /v2/products/123 HTTP/1.1
Host: api.apiguide.dev
```

The identifier can be a hash, timestamp, or sequential number (`product:123:v2`). Versioned keys sidestep race conditions where invalidation events arrive out of order, but obsolete keys must be cleaned up or the cache bloats. This pairs well with the `immutable` directive for static, versioned assets that never change while fresh.

| Strategy | Consistency | Complexity | Best for |
| --- | --- | --- | --- |
| TTL | Eventual | Low | Tolerant, stable data |
| Conditional revalidation | Good | Low | Large or slow responses |
| Event-based | Near real-time | High | Volatile, high-value data |
| Tag/key purge | Near real-time | Medium | Related object groups |
| Versioned URLs | Strong | Medium | Static assets, API versions |

---

## 7. Hybrid Strategy

No single approach wins outright, so production systems layer them: TTL as a safety net, conditional revalidation to cut transfer cost, and event-based or tag purging for immediacy. Versioned URLs handle static assets. The goal is a system where the fast path is cheap and the correctness path is reliable.

---

## 8. Pitfalls and Best Practices

* **Cache stampede.** When a hot key expires, simultaneous requests hammer the origin. Mitigate with `stale-while-revalidate`, distributed locks (Redis SETNX), request coalescing (singleflight), or probabilistic early expiration that refreshes just before the TTL ends.
* **Over- vs. under-caching.** Match TTLs to data volatility rather than guessing; monitor hit rates to correct course.
* **Security.** Never cache PII or credentials in shared caches. For user-specific data that must be cached, use `Cache-Control: private` and `Vary: Authorization`.
* **Granularity.** Cache fields or fragments rather than whole large payloads to raise hit potential and reduce memory pressure.
* **Monitoring.** Track hit rate, eviction rate, and latency continuously; low hit rates signal a strategy that needs tuning. See [cdn edge caching](/guides/cdn-edge-caching) and the [HTTP caching specification](/specifications/http-caching) for related detail.
