---
name: "Max-Forwards"
description: "A hop counter for TRACE and OPTIONS that limits how many proxies may forward the request, so you can probe a chain one hop at a time."
category: "request"
standard: true
relatedCodes: [200]
---

## What is the Max-Forwards header?

The `Max-Forwards` request header, defined in Section 7.6.2 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-max-forwards), limits how many more times a [`TRACE`](/methods/trace) or [`OPTIONS`](/methods/options) request may be forwarded by proxies. Its value is a non-negative decimal integer.

```http
Max-Forwards: 2
```

Each intermediary that receives a `TRACE` or `OPTIONS` request with `Max-Forwards` MUST check and update it before forwarding:

* If the value is `0`, the intermediary MUST NOT forward the request and MUST respond itself, as the final recipient.
* If it is greater than zero, the intermediary MUST forward the lesser of the received value minus one and its own maximum supported value.

A recipient MAY ignore `Max-Forwards` on any other method. It is a diagnostic tool for finding where in a chain of proxies a request fails or loops.

## API Usage & Best Practices

* **Use it to walk a proxy chain.** Sending `OPTIONS` with `Max-Forwards: 0`, then `1`, then `2`, gets a response from each hop in turn, which shows which layer is answering and which one breaks. It only works through intermediaries that implement it.
* **Do not expect it on ordinary API calls.** It has no defined effect on [`GET`](/methods/get), [`POST`](/methods/post) or anything other than `TRACE` and `OPTIONS`. For loop detection on normal traffic, proxies use [`Via`](/headers/via).
* **Keep `TRACE` disabled at the edge.** `TRACE` reflects the request back, which can leak headers such as cookies and credentials that proxies added. With `TRACE` off, `Max-Forwards` with `TRACE` is a lab tool, and `OPTIONS` is the way to probe production.
* **Do not confuse it with TTLs elsewhere.** It counts HTTP-level forwards by proxies, not network hops, and not retries.
* **Your origin can ignore it.** An origin server is the final recipient anyway. Only intermediaries have to act on it.

## Examples

Probing the first proxy only. With `Max-Forwards: 0` it answers itself instead of forwarding:

```http
OPTIONS * HTTP/1.1
Host: api.example.com
Max-Forwards: 0
```

```http
HTTP/1.1 200 OK
Allow: GET, HEAD, OPTIONS
Content-Length: 0
```

A request that may pass through one proxy before the next one must answer. The first proxy forwards it with `Max-Forwards: 0`:

```http
OPTIONS /v1/orders HTTP/1.1
Host: api.example.com
Max-Forwards: 1
```
