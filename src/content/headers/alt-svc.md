---
name: "Alt-Svc"
description: "Advertises another protocol, host or port where the same origin can be reached, which is how clients discover HTTP/3."
category: "response"
standard: true
relatedCodes: [421]
reference:
  title: "RFC 7838"
  url: https://www.rfc-editor.org/rfc/rfc7838.html
updatedDate: 2026-10-17
---

## What is the Alt-Svc header?

The `Alt-Svc` response header, defined in [RFC 7838](https://www.rfc-editor.org/rfc/rfc7838.html) (HTTP Alternative Services), tells the client that the same origin is also available somewhere else: over a different protocol, on a different port, or on a different host. Its most common use by far is advertising [HTTP/3](/specifications/http3): a server answering over HTTP/1.1 or [HTTP/2](/specifications/http2) sends `Alt-Svc: h3=":443"`, and a client that speaks HTTP/3 can switch to QUIC for later requests.

The value is either the keyword `clear` or a comma-separated list of alternatives in the server's order of preference. Each alternative is an ALPN protocol ID and an authority (an optional host, then a colon and a port), followed by optional parameters:

| Parameter | Meaning |
| :--- | :--- |
| `ma` | Max age: how many seconds the client may remember the alternative. The default is 24 hours (86400), measured from when the response was generated, so the response's [`Age`](/headers/age) is subtracted. |
| `persist` | `persist=1` asks the client to keep the alternative across network changes. Without it, a client that notices a network change should drop the entry. |

`clear` tells the client to forget every alternative it has cached for that origin. A new `Alt-Svc` value replaces the cached set rather than adding to it.

A client using an alternative should send the `Alt-Used` request header naming the host and port it actually connected to. In HTTP/2, a server can send the same information in an `ALTSVC` frame instead of the header.

## API Usage & Best Practices

* **It is a hint, never a redirect.** The origin does not change: the URL, the `Host`, cookies and same-origin rules all stay the same. The client may ignore the advertisement entirely, and many server-side HTTP clients do. Never depend on clients switching.
* **Let your edge send it.** If your CDN or load balancer terminates HTTP/3, it usually adds `Alt-Svc` for you. Emitting it from the application as well risks advertising a protocol on a port where nothing listens. Advertise only what the edge actually serves.
* **The alternative must be authenticated for the origin.** RFC 7838 requires the client to validate the alternative's certificate against the **origin's** host name, and to send SNI for the origin. An alternative on another host only works if that host presents a certificate valid for your API's name. Cleartext alternatives such as `h2c` cannot be used this way.
* **Use a sensible `ma`.** The 24-hour default is fine for a stable deployment. Before you remove an alternative, lower `ma` well ahead of time, or send `clear`, so clients are not left trying a port that is gone. A client falls back to the origin if the alternative fails, but every failed attempt costs it time.
* **Answer misrouted requests with 421.** If a request reaches an alternative that cannot serve that origin, return [`421 Misdirected Request`](/status-codes/421). RFC 7838 says the client must then remove that alternative from its cache, and it may retry the request on another connection.
* **Expect DNS to take over discovery.** HTTPS DNS records (RFC 9460) can advertise HTTP/3 before the first connection, which `Alt-Svc` cannot. Many deployments send both. `Alt-Svc` remains the fallback when the DNS record is absent or the resolver does not return it.
* **Do not use it for load balancing or failover.** Clients choose whether and when to use an alternative, and cache it for `ma` seconds. That is too loose and too sticky to steer traffic reliably.

## Examples

Advertising HTTP/3 on the same host and port, remembered for a day:

```http
HTTP/2 200
Content-Type: application/json
Alt-Svc: h3=":443"; ma=86400
```

HTTP/3 on a different port, with HTTP/2 on another host as a second choice:

```http
HTTP/1.1 200 OK
Alt-Svc: h3=":8443"; ma=3600, h2="alt.example.com:443"; ma=3600
```

A later request sent over the HTTP/2 alternative on `alt.example.com`. The authority is still the origin:

```http
GET /v1/orders HTTP/2
Host: api.example.com
Alt-Used: alt.example.com
```

Telling clients to forget all alternatives before decommissioning them:

```http
HTTP/1.1 200 OK
Alt-Svc: clear
```
