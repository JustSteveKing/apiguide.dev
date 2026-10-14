---
name: "Forwarded"
description: "Standard header in which proxies record the client address, protocol and host a request arrived with, replacing the X-Forwarded-* family."
category: "request"
standard: true
relatedCodes: [403, 429]
---

## What is the Forwarded header?

The `Forwarded` request header, defined in [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239.html), carries the information a reverse proxy would otherwise destroy by terminating the connection: who connected to it, on which interface, over which protocol, and with which `Host`. It is the standardized replacement for [`X-Forwarded-For`](/headers/x-forwarded-for), `X-Forwarded-Proto` and `X-Forwarded-Host`, folding all three into one field.

The value is a comma-separated list of elements, one per proxy, each a set of semicolon-separated `name=value` pairs. Four parameters are defined:

| Parameter | Meaning |
| :--- | :--- |
| `for` | The node that made the request to the proxy, usually the client |
| `by` | The interface on the proxy where the request came in |
| `host` | The [`Host`](/headers/host) header as the proxy received it |
| `proto` | The scheme of the incoming request, such as `http` or `https` |

A node identifier is an IP address with an optional port, the literal `unknown`, or an obfuscated identifier starting with an underscore (`_hidden`) that a proxy uses to avoid leaking internal addresses. Because `:` is not legal in a token, an IPv6 address or any value with a port **must** be a quoted string, and IPv6 goes in square brackets: `for="[2001:db8:cafe::17]:4711"`.

## API Usage & Best Practices

* **Read it from the right, and only as far as you trust.** Each proxy appends its element, so the list is ordered from the first proxy to the last. Anything a client sent arrives at the front of the list untouched. Walk from the rightmost element, skip the ones your own proxies added, and take the first one you did not add. RFC 7239 Section 8.1 is explicit that the header "cannot be relied upon to be correct", because any node on the path, the client included, can write to it.
* **Never trust it on a server that is reachable directly.** If the origin accepts connections that bypass your proxy, a client can send a `Forwarded` header of its choosing and none of it is trustworthy. Lock the origin down to the proxy's addresses first.
* **Use `proto` and `host` to build absolute URLs.** An application behind a TLS-terminating proxy sees plain HTTP on its own socket. Building a [`Location`](/headers/location) or a pagination link from that produces `http://` URLs. Read `proto` and `host` from the element your trusted proxy added instead.
* **Normalize it at the edge.** If you control the first proxy, have it strip any inbound `Forwarded` (and `X-Forwarded-*`) from the client and write a fresh one. Everything downstream then only has to trust one hop.
* **Do not reflect it in responses.** The RFC says origins and intermediaries should not copy it into a response, because it exposes the proxy chain and client addresses. It is privacy-sensitive by design.
* **Prefer it for new infrastructure, but expect `X-Forwarded-For`.** Most proxies, load balancers and frameworks still default to the `X-Forwarded-*` headers. If you parse both, decide which one wins and configure the edge to set only that one, otherwise a client can supply whichever your code does not overwrite.

## Examples

A request that passed through two proxies, the first of which recorded an IPv6 client:

```http
GET /v1/orders HTTP/1.1
Host: internal.example.com
Forwarded: for="[2001:db8:cafe::17]:4711";proto=https;host=api.example.com, for=198.51.100.17;by=203.0.113.43
```

An edge proxy hiding its internal topology with obfuscated identifiers:

```http
GET /v1/orders HTTP/1.1
Host: internal.example.com
Forwarded: for=192.0.2.60;proto=https;by=_edge01
```
