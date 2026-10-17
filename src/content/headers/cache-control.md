---
name: "Cache-Control"
description: "Directives for caching mechanisms in both requests and responses."
category: "both"
standard: true
relatedCodes: [200, 304]
reference:
  title: "RFC 9111, Section 5.2"
  url: https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2
updatedDate: 2026-10-14
---

## What is the Cache-Control header?

The `Cache-Control` header specifies instructions for caching in both client browsers and intermediary proxies (like CDNs).

## API Usage & Best Practices

* **Sensitive or per-user data: `no-store` on its own**: `no-store` forbids every cache, private and shared, from storing the response. Adding `no-cache`, `must-revalidate` or `max-age=0` to it changes nothing for a cache that follows RFC 9111, so send `Cache-Control: no-store` and stop there.
* **Per-user data the browser may keep: `private`**: `private` lets the client's own cache store the response but keeps it out of shared caches such as CDNs and proxies. Pair it with `max-age` for a freshness window, or with `no-cache` to make the client revalidate with its [`ETag`](/headers/etag) on every use.
* **Shared data: `max-age` plus `s-maxage`**: For responses that are the same for every caller (country lists, public configuration), use `public, max-age=60, s-maxage=86400`. `s-maxage` overrides `max-age` for shared caches only, so the CDN can hold the response longer than browsers do. A shared cache will not reuse a response to a request with an `Authorization` header unless it carries `public`, `s-maxage` or `must-revalidate`.
* **Mutations need nothing extra**: RFC 9110 makes responses to `PUT` and `DELETE` non-cacheable, and a `POST` response is cacheable only with explicit freshness information and a matching [`Content-Location`](/headers/content-location). You do not need to decorate write responses to keep them out of caches.
* **Target the CDN separately**: To give your CDN different instructions from browsers without touching `Cache-Control`, use [`CDN-Cache-Control`](/headers/cdn-cache-control). To see what a cache actually did with a response, read [`Cache-Status`](/headers/cache-status).

## Examples

A per-user response no cache should store:

```http
HTTP/1.1 200 OK
Cache-Control: no-store
```

A shared response, cached briefly by browsers and for a day by the CDN:

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=60, s-maxage=86400
```
