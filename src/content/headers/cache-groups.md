---
name: "Cache-Groups"
description: "Tags a cacheable response with one or more group names, so a cache can invalidate every stored response in a group together."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Cache-Groups header?

The `Cache-Groups` response header, defined in Section 2 of [RFC 9875](https://www.rfc-editor.org/rfc/rfc9875.html) (HTTP Cache Groups, Standards Track, October 2025), associates a stored response with one or more named groups. HTTP caching otherwise works one resource at a time; groups let a cache treat related responses together, most usefully by invalidating them together.

The value is a [Structured Field](/specifications/structured-fields) List of Strings. Each String names a group. The names are opaque to the cache: they may mean something to your server, but the cache only compares them, character by character and case-sensitively. Order does not matter, and unrecognized parameters are ignored.

```http
Cache-Groups: "scripts"
```

Two stored responses are in the same group when both carry the same String in `Cache-Groups` and both come from the same origin. Groups never cross origins, and they work within a single cache; RFC 9875 does not address keeping several caches in sync.

When a cache invalidates a stored response, it MAY also invalidate every other stored response that shares a group with it. That grouped invalidation does not cascade further. A response can also trigger it directly with [`Cache-Group-Invalidation`](/headers/cache-group-invalidation).

## API Usage & Best Practices

* **Group by what changes together.** Tag every representation that depends on a piece of data with a name for that data: a collection, a tenant, a product. Then a write to that data can invalidate all of them, which is the problem URL-prefix purges solve badly. See [cache invalidation](/guides/cache-invalidation).
* **Keep names short and few.** Implementations MUST support at least 32 groups per field, each at least 32 characters long. Stay inside that and your groups work everywhere that implements the RFC.
* **Remember the MAY.** RFC 9875 only permits caches to invalidate grouped responses. A cache that ignores `Cache-Groups` is still conforming. Keep freshness lifetimes in [`Cache-Control`](/headers/cache-control) honest rather than relying on group invalidation to save you from stale data.
* **Check your CDN's own tagging.** Many CDNs already offer tag-based purging through vendor-specific headers and purge APIs. Whether a given cache honors `Cache-Groups` is something to confirm in its documentation, not assume.
* **Watch out on shared hosting.** Every resource on an origin can join any group on that origin. If several parties share one origin, one of them can group its resources with another's and invalidate them. Control who can set these headers.

## Examples

A script tagged with one group, from RFC 9875:

```http
HTTP/1.1 200 OK
Content-Type: application/javascript
Cache-Control: max-age=3600
Cache-Groups: "scripts"
```

An API representation that depends on a product and on its category:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=300
Cache-Groups: "product-8812", "category-shoes"
```
