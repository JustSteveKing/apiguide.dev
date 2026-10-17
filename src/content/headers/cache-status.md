---
name: "Cache-Status"
description: "Reports how each cache on the path handled a response: hit or forwarded, why, and how much freshness remains."
category: "response"
standard: true
relatedCodes: [200, 304]
reference:
  title: "RFC 9211"
  url: https://www.rfc-editor.org/rfc/rfc9211.html
updatedDate: 2026-10-14
---

## What is the Cache-Status header?

The `Cache-Status` response header, defined in [RFC 9211](https://www.rfc-editor.org/rfc/rfc9211.html), is the standard way for a cache to say what it did with a request. It replaces the vendor-specific `X-Cache` and `X-Cache-Hit` style headers with one format every cache can share.

It is a [Structured Field](/specifications/structured-fields) List. Each member names one cache, as a token or string, followed by parameters. The first member is the cache **closest to the origin** and the last is the one closest to the client, and each cache appends its entry while preserving those already present.

| Parameter | Type | Meaning |
| :--- | :--- | :--- |
| `hit` | Boolean | Served from cache without going forward. Mutually exclusive with `fwd` |
| `fwd` | Token | The request went forward toward the origin, and why |
| `fwd-status` | Integer | The status the next hop returned; if absent, assume the status in this response |
| `ttl` | Integer | Remaining freshness in seconds; negative means stale |
| `stored` | Boolean | Whether the cache stored the forwarded response |
| `collapsed` | Boolean | Whether the request was collapsed with others in flight |
| `key` | String | A representation of the cache key, implementation-specific |
| `detail` | String or Token | Implementation-specific extra information |

The `fwd` values, most specific first: `bypass` (configured not to cache), `method` (the method requires forwarding), `uri-miss` (nothing stored for this URI), `vary-miss` (stored responses exist but none match [`Vary`](/headers/vary)), `miss` (the cache cannot tell which of the two), `request` (the request's [`Cache-Control`](/headers/cache-control) forbade using a fresh response), `stale` (the selected response was stale) and `partial` (a stored partial response did not cover the requested range).

## API Usage & Best Practices

* **Read it before guessing.** When a client reports stale data, `Cache-Status` tells you which layer served it and with how much `ttl` left. Combined with [`Age`](/headers/age), it settles most caching arguments in one request.
* **Distinguish `vary-miss` from `uri-miss`.** A high rate of `vary-miss` means the URI is cached but your `Vary` is fragmenting the cache, often because it includes a header with high cardinality. That is a fix in the API, not in the CDN.
* **Use `fwd=stale; fwd-status=304` to confirm revalidation works.** It means the cache had a stale copy, sent a conditional request, and the origin answered [`304 Not Modified`](/status-codes/304). If you only ever see `fwd-status=200`, your validators are not being honored.
* **Name your own caches clearly.** If you run an application-level or gateway cache, emit `Cache-Status` with a stable identifier for it, not a hostname. Append to the existing value rather than replacing it.
* **Do not expose `key` or `detail` to the public.** The RFC's security considerations note that cache keys help an attacker understand and target cache poisoning, and that knowing whether a response was stored can support timing attacks. Send the sensitive parameters only to authorized clients, or strip them at the edge.
* **Do not build client behavior on it.** It is a diagnostic field. Clients should use [`Cache-Control`](/headers/cache-control), [`ETag`](/headers/etag) and [`Age`](/headers/age) for freshness decisions, not whether some cache reported a hit.

## Examples

A CDN hit with nine minutes of freshness left, in front of an origin cache that also hit:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Age: 42
Cache-Status: OriginCache; hit; ttl=1100, "ExampleCDN"; hit; ttl=545
```

A stale entry revalidated against the origin, which confirmed it was unchanged:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Status: ExampleCDN; fwd=stale; fwd-status=304
```

A request for a URI with no stored response, collapsed with concurrent requests and stored for later:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Status: ExampleCDN; fwd=uri-miss; collapsed; stored
```
