---
name: "X-Forwarded-Host"
description: "De facto request header in which a proxy records the Host the client originally asked for. Spoofable, and a common source of host header attacks."
category: "request"
standard: false
relatedCodes: [400, 421]
updatedDate: 2026-10-17
---

## What is the X-Forwarded-Host header?

`X-Forwarded-Host` (XFH) is set by a reverse proxy, load balancer or CDN to record the [`Host`](/headers/host) header the client sent. When the proxy rewrites `Host` to reach the backend, for example to `orders.internal` or a CDN origin hostname, this header is how the application learns the name the client actually used.

```http
X-Forwarded-Host: api.example.com
```

It has never been standardized and is not in the IANA HTTP Field Name Registry. [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239.html) defines the `host` parameter of [`Forwarded`](/headers/forwarded) as its replacement, but `X-Forwarded-Host` is the form most proxies and frameworks support by default, alongside [`X-Forwarded-For`](/headers/x-forwarded-for) and [`X-Forwarded-Proto`](/headers/x-forwarded-proto). In practice it may include a port, as `Host` can.

## API Usage & Best Practices

* **Use it for absolute URLs, behind a proxy you control.** Together with `X-Forwarded-Proto`, it lets the application build [`Location`](/headers/location) values, pagination links and other absolute URLs with the public hostname instead of an internal one.
* **Treat it as attacker-controlled until proven otherwise.** Any client can send `X-Forwarded-Host: evil.example`. If the application trusts it and the proxy does not overwrite it, that value flows into every URL the application generates. The well-known results are password reset and magic-link emails pointing at the attacker's domain, and web cache poisoning, where a cache that does not include the header in its key stores a response with the attacker's host in it and serves it to everyone.
* **Overwrite it at the edge.** Configure your outermost proxy to set it from the `Host` it received, discarding any value the client supplied, and configure your framework to trust it only from your proxy's addresses.
* **Better still, do not derive your hostname from the request.** For anything security-sensitive, such as links in emails, OAuth redirect URIs and webhook signing, use the public base URL from configuration. Then no header can change it.
* **Validate against an allowlist.** If the application must serve several hostnames, check the effective host (from `Host` or a trusted `X-Forwarded-Host`) against the list of names you serve and reject anything else with [`400 Bad Request`](/status-codes/400) or [`421 Misdirected Request`](/status-codes/421).
* **Expect a list through multiple proxies.** Some proxies append rather than overwrite, producing a comma-separated value. Decide which hop you trust and read that entry, or make each hop overwrite.
* **Pick one header and own it.** If your stack reads both `Forwarded` and `X-Forwarded-Host`, strip both at the edge and set only the one you read.

## Examples

A request forwarded by a CDN to an origin with an internal hostname:

```http
GET /v1/orders HTTP/1.1
Host: origin-7.internal.example.net
X-Forwarded-Host: api.example.com
X-Forwarded-Proto: https
X-Forwarded-For: 192.0.2.44
```

A spoofed value that a correctly configured edge would overwrite before it reached the application:

```http
POST /v1/password-resets HTTP/1.1
Host: api.example.com
X-Forwarded-Host: evil.example
Content-Type: application/json

{"email": "user@example.com"}
```

The standardized equivalent of the first request:

```http
GET /v1/orders HTTP/1.1
Host: origin-7.internal.example.net
Forwarded: for=192.0.2.44;proto=https;host=api.example.com
```
