---
name: "X-Forwarded-For"
description: "De facto request header listing the client and proxy IP addresses a request passed through. Trivially spoofed unless parsed from the right."
category: "request"
standard: false
relatedCodes: [403, 429]
updatedDate: 2026-10-17
---

## What is the X-Forwarded-For header?

The `X-Forwarded-For` (XFF) request header is a comma-separated list of IP addresses that proxies append to as they forward a request. In a well-behaved chain the leftmost address is the original client and each subsequent address is a proxy, with the most recent proxy rightmost. The address of the proxy that connected to your server is not in the list at all: it is the socket's peer address.

```http
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

It has never been standardized. [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239.html) defines [`Forwarded`](/headers/forwarded) as its replacement, but `X-Forwarded-For`, along with its companions [`X-Forwarded-Proto`](/headers/x-forwarded-proto) and [`X-Forwarded-Host`](/headers/x-forwarded-host), remains what most load balancers, CDNs and frameworks send by default.

## API Usage & Best Practices

* **The leftmost address is attacker-controlled.** A proxy appends to whatever the client sent, so a client that sends `X-Forwarded-For: 10.0.0.1` gets that value passed straight through at the front of the list. Taking the first address is the single most common way IP-based rate limits and allowlists get bypassed.
* **Parse from the right, skipping your own proxies.** There are two sound strategies. With a *trusted proxy count*, configure how many reverse proxies sit in front of you and take the address that many hops in from the right (with one proxy, the rightmost entry). With a *trusted proxy list*, walk from the rightmost entry and skip every address that belongs to your proxies; the first one that does not is the client as far as you can know. Prefer the list: it survives a proxy being added or removed.
* **Treat multiple headers as one list.** A request can carry several `X-Forwarded-For` lines. Concatenate them in order before parsing; reading only the first or last line lets a client inject a value your proxy never saw.
* **Accept that the answer may be a proxy.** The first untrusted address from the right can belong to a corporate proxy or carrier-grade NAT rather than the end user. It is still the only address that is safe to use for security decisions.
* **No part of it is trustworthy on a directly reachable origin.** If clients can connect to your server without going through the proxy, they can write the whole header. Firewall the origin to your proxy's addresses before trusting any of it.
* **Use the leftmost value only where spoofing is harmless**, such as rough geolocation for analytics. Never for authentication, rate limiting, audit logs of record, or access control.
* **Validate what you parse.** Entries can be garbage, private addresses or absurdly long lists. Parse each one as an IP address and reject or ignore anything that is not.
* **Pick one header and own it.** If your stack reads both `Forwarded` and `X-Forwarded-For`, configure the edge to strip both from inbound requests and set only the one you read.

## Examples

A client behind one corporate proxy, reaching an API behind a load balancer at `203.0.113.10` (the load balancer is the socket peer, so it does not appear in the list):

```http
GET /v1/orders HTTP/1.1
Host: api.example.com
X-Forwarded-For: 192.0.2.44, 198.51.100.7
X-Forwarded-Proto: https
```

A spoofed request after passing through the same load balancer. With one trusted proxy, the correct client address is the rightmost entry, `198.51.100.23`, not the injected `127.0.0.1`:

```http
GET /v1/admin HTTP/1.1
Host: api.example.com
X-Forwarded-For: 127.0.0.1, 198.51.100.23
```
