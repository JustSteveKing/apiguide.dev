---
title: "HTTP Compression"
description: "How APIs negotiate and apply gzip, Brotli, and Zstandard compression, and the caching and security considerations involved."
category: "negotiation"
---

## Introduction to HTTP Compression

HTTP compression reduces the size of response bodies transmitted between servers and clients, lowering bandwidth consumption and improving transfer times, particularly for text-based API payloads and clients on slower connections. It operates through a negotiation handshake defined by HTTP Semantics (RFC 9110): the client advertises the algorithms it supports, and the server chooses one and signals its choice back. Applied correctly, compression is a low-cost optimization; applied carelessly, it wastes CPU, breaks caches, or leaks secrets.

---

## 1. The Negotiation Handshake

Compression is negotiated with two headers that mirror each other.

### Request: `Accept-Encoding`

The client declares the algorithms it can decode using the [`Accept-Encoding`](/headers/accept-encoding) request header. Quality values (`q`) rank preferences, and the `identity` token represents no compression.

```http
GET /reports/2026 HTTP/1.1
Host: api.apiguide.dev
Accept-Encoding: br, gzip;q=0.8, deflate;q=0.5
```

### Response: `Content-Encoding`

If the server supports one of the listed algorithms and decides to compress, it applies the chosen algorithm and names it in the [`Content-Encoding`](/headers/content-encoding) response header.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: br
Vary: Accept-Encoding
```

A request without `Accept-Encoding` implies any encoding is acceptable, but servers should default to sending uncompressed content unless a supported algorithm is explicitly advertised. Compression fits within the broader [content negotiation](/guides/content-negotiation) model.

---

## 2. Algorithms

Several algorithms are in common use, each defined by its own specification.

| Algorithm | Token | Spec | Notes |
| --- | --- | --- | --- |
| Gzip | `gzip` | RFC 1952 | Universal support; the long-standing default. |
| Brotli | `br` | RFC 7932 | Higher ratios than gzip for text; widely supported by modern clients. |
| Zstandard | `zstd` | RFC 8878 | Very fast compression and decompression; ratios comparable to gzip and better. |
| Deflate | `deflate` | RFC 1951 | Less common as a direct content encoding; used internally by gzip. |

Reported figures put Brotli's ratio slightly ahead of Zstandard, while Zstandard compresses noticeably faster, which makes it attractive for dynamic responses generated per request. A practical preference order for APIs is Brotli first, gzip as a broadly compatible fallback, and Zstandard where throughput and CPU cost matter most.

---

## 3. When to Compress

Compression is not free, so apply it selectively.

### Content type

Prioritize text-based payloads such as JSON, XML, HTML, CSS, and JavaScript, which are highly redundant and often shrink by 70-90%. Avoid re-compressing already-compressed binary formats like JPEG, PNG, WebP, audio, and video; the attempt burns CPU and can slightly enlarge the output.

### Minimum size

Do not compress very small responses. The per-response overhead can outweigh or reverse any savings. Common thresholds range from roughly 256 bytes to 1 KB. Google suggests a floor between 150 and 1000 bytes, while Akamai uses 860 bytes, noting that objects under that size typically fit in a single network packet anyway.

### CPU cost

Compression is CPU-intensive, and higher levels cost more for diminishing returns. Compressing a 100 KB file has been measured to increase server CPU usage many times over versus serving it raw. Two mitigations apply:

* **Static assets**: pre-compress at build time (for example NGINX `gzip_static` / `brotli_static`) so the server serves stored `.gz`/`.br` files instead of compressing on the fly.
* **Dynamic responses**: choose a mid-range level (for example gzip level 4-6) that balances ratio against CPU.

---

## 4. Caching and the `Vary` Header

A compressed and an uncompressed representation of the same URL are different payloads, so caches must key on the encoding. The [`Vary`](/headers/vary) header does this:

```http
HTTP/1.1 200 OK
Content-Encoding: gzip
Vary: Accept-Encoding
```

Without `Vary: Accept-Encoding`, a shared cache (CDN or proxy) may store one representation and serve it to every client — handing compressed bytes to a client that cannot decode them, or an uncompressed copy to one that could have received a smaller one. Most servers automate this (for example NGINX `gzip_vary on`).

Normalize the incoming `Accept-Encoding` value before varying on it. Storing a separate cache entry per raw header string fragments the cache; collapsing it to a small set of known encodings keeps hit rates high.

---

## 5. Security: The BREACH Risk

Compression combined with encryption can leak secrets. The BREACH attack targets HTTP-level compression (distinct from the TLS-level CRIME attack, which led to compression being removed from TLS). It works because compression shrinks redundant data: an attacker who can inject input reflected in a response, and who can observe the compressed-then-encrypted response size, can infer whether their guess matches a secret elsewhere in the body.

Three conditions must all hold for a response to be exploitable:

1. The response uses HTTP-level compression.
2. It reflects attacker-controlled input in the body.
3. It contains a secret of interest (such as a CSRF token) in the same body.

### Mitigations

Disabling compression outright is rarely acceptable given its performance value. Instead:

* **Separate secrets from reflected input** so the two never share a compressible response.
* **Randomize sensitive tokens** (for example masking CSRF tokens) on every response so patterns cannot be inferred.
* **Use `SameSite` cookies** to blunt the CSRF attacks that BREACH often aims to enable.
* **Mask length** by adding random padding to responses.
* **Rate-limit** to slow the many requests an attack requires.
* **Selectively disable** compression on the few highly sensitive endpoints, or when the request did not originate from your own application.

---

## Summary

Compression is a high-value optimization when negotiated with `Accept-Encoding` and `Content-Encoding`, scoped to compressible text above a sensible minimum size, and cached correctly with `Vary: Accept-Encoding`. Prefer Brotli with a gzip fallback, pre-compress static assets, and keep the BREACH conditions in mind so sensitive endpoints do not leak secrets through response size.
