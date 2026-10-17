---
name: "CDN-Cache-Control"
description: "Cache directives aimed only at CDN caches, letting an origin set edge caching separately from browsers and other caches."
category: "response"
standard: true
relatedCodes: [200]
reference:
  title: "RFC 9213"
  url: https://www.rfc-editor.org/rfc/rfc9213.html
updatedDate: 2026-10-14
---

## What is the CDN-Cache-Control header?

The `CDN-Cache-Control` response header, defined in [RFC 9213](https://www.rfc-editor.org/rfc/rfc9213.html), carries the same directives as [`Cache-Control`](/headers/cache-control) but applies only to CDN caches: caches in a distributed network acting on behalf of the origin. It lets an origin tell the edge one thing and browsers and other caches another, without the overloading that `s-maxage` does across every shared cache.

RFC 9213 calls this a *targeted cache-control field*. A cache that supports one keeps an ordered target list of field names. For each response, it uses the first field on that list with a valid, non-empty value, and when it does, it **ignores `Cache-Control` and `Expires` entirely** for that response. If none is valid, normal HTTP caching applies. Caches not targeted by the field must ignore it and pass it through.

Unlike `Cache-Control`, it is a [Structured Field](/specifications/structured-fields) Dictionary. Directives such as `max-age=600` and `no-store` look the same, but a value that fails to parse makes the cache ignore the whole field, as though it were absent.

## API Usage & Best Practices

* **Cache at the edge, not in the browser.** The commonest use: let the CDN hold a response for minutes while clients revalidate on every request. `CDN-Cache-Control: max-age=600` with `Cache-Control: no-cache` does exactly that.
* **Keep a sensible `Cache-Control` alongside it.** Caches that do not understand `CDN-Cache-Control` fall back to `Cache-Control`. Never send only the targeted field and assume nothing else will cache the response.
* **Purge when you lengthen edge TTLs.** A long CDN freshness lifetime means updates do not reach clients until the CDN entry expires or is purged. See [CDN and edge caching](/guides/cdn-edge-caching) and [cache invalidation](/guides/cache-invalidation).
* **Watch the `Age` it produces.** A CDN holding a response longer than `Cache-Control: max-age` allows will forward it with an [`Age`](/headers/age) that already exceeds `max-age`, so downstream caches treat it as stale immediately. RFC 9213 lets implementations mitigate this by removing `Age` or updating [`Date`](/headers/date), but does not require it. Check what your CDN does.
* **To keep responses out of every cache except the CDN,** send `Cache-Control: no-store` with a non-empty `CDN-Cache-Control`. RFC 9213's own example uses `CDN-Cache-Control: none`, which is not a registered directive but stops the field being empty, so the CDN obeys it instead of `no-store` and falls back on its own defaults.
* **Never use it for personalized responses.** Responses that depend on [`Authorization`](/headers/authorization) or a cookie must not be cached at the edge unless the cache key includes the identity. `private` in `CDN-Cache-Control` is honored, but the safer default is not to send an edge-cacheable directive at all on authenticated endpoints.
* **Know your CDN's own field.** RFC 9213 expects CDNs to define their own more specific fields that sit ahead of `CDN-Cache-Control` on the target list. Cloudflare, for example, supports both `CDN-Cache-Control`, which it obeys and passes downstream to other CDNs, and `Cloudflare-CDN-Cache-Control`, which only Cloudflare obeys and which it does not forward. When both are present, Cloudflare uses the more specific one. Check your provider's documentation rather than assuming.

## Examples

Edge caching for ten minutes, with browsers revalidating every time:

```http
HTTP/1.1 200 OK
Content-Type: application/json
ETag: "v42"
Cache-Control: no-cache
CDN-Cache-Control: max-age=600
```

A CDN-specific lifetime with a general fallback for other shared caches, taken from RFC 9213:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60, s-maxage=120
CDN-Cache-Control: max-age=600
```

Stored by CDN caches for ten minutes, and by no other cache:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
CDN-Cache-Control: max-age=600
```
