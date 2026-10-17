---
name: "Cache-Group-Invalidation"
description: "Sent on a response to an unsafe request, it asks caches to invalidate stored responses in the named cache groups."
category: "response"
standard: true
relatedCodes: [200, 204]
reference:
  title: "RFC 9875"
  url: https://www.rfc-editor.org/rfc/rfc9875.html
updatedDate: 2026-10-17
---

## What is the Cache-Group-Invalidation header?

The `Cache-Group-Invalidation` response header, defined in Section 3 of [RFC 9875](https://www.rfc-editor.org/rfc/rfc9875.html) (HTTP Cache Groups, Standards Track, October 2025), lets the response to a state-changing request say which cache groups it has made stale. A cache that sees it MAY invalidate every stored response from the same origin that belongs to any listed group, as set by [`Cache-Groups`](/headers/cache-groups).

The value is a [Structured Field](/specifications/structured-fields) List of Strings, each naming a group. Order does not matter and unrecognized parameters are ignored.

```http
Cache-Group-Invalidation: "eurovision-results", "australia"
```

It MUST be ignored on responses to requests with a safe method, such as [`GET`](/methods/get) or [`HEAD`](/methods/head). Only responses to unsafe requests, such as [`POST`](/methods/post), [`PUT`](/methods/put), [`PATCH`](/methods/patch) and [`DELETE`](/methods/delete), can trigger it. Like grouped invalidation in general, it does not cascade.

## API Usage & Best Practices

* **Send it from the write, naming what the write touched.** If updating a product changes the product page, the category listing and search results, put all of those groups in the response to the update. HTTP already invalidates the target URI of an unsafe request; this header reaches the related responses that HTTP caching cannot otherwise know about. See [cache invalidation](/guides/cache-invalidation).
* **Do not send it on a `GET`.** It will be ignored, by design, so a read cannot be used to flush a cache.
* **It only reaches caches the response passes through.** A browser cache or a reverse proxy in the response path can act on it. A CDN edge in another region, or a cache that never saw this response, will not. For those, use your CDN's purge API, and keep sensible freshness lifetimes as the backstop.
* **Treat it as a hint.** Caches MAY act on it, and RFC 9875 notes that cache extensions such as targeted cache control (RFC 9213) could make it a requirement for the caches they address. Until your cache documents support, verify invalidation actually happens before relying on it.
* **Stay within the interoperable limits.** Implementations MUST support at least 32 groups per field value, each at least 32 characters long.
* **Restrict it on shared origins.** Any resource on an origin can invalidate any group on that origin, so on shared hosting one party can flush another's cache entries.

## Examples

A response to a `POST` that affects two groups, from RFC 9875:

```http
HTTP/1.1 200 OK
Content-Type: text/html
Cache-Group-Invalidation: "eurovision-results", "australia"
```

An API update invalidating the product and its category:

```http
PATCH /v1/products/8812 HTTP/1.1
Host: api.example.com
Content-Type: application/merge-patch+json

{"price": "79.00"}
```

```http
HTTP/1.1 204 No Content
Cache-Group-Invalidation: "product-8812", "category-shoes"
```
