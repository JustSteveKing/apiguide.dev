---
name: "Upgrade"
description: "Invites the server to switch an HTTP/1.1 connection to a different protocol, most often WebSocket."
category: "both"
standard: true
relatedCodes: [101, 426]
---

## What is the Upgrade header?

The `Upgrade` header, defined in RFC 9110 Section 7.8, is the mechanism for switching an HTTP/1.1 connection to another protocol without opening a new one. A client lists the protocols it would like, in descending order of preference; the server either ignores the header and answers normally, or replies [`101 Switching Protocols`](/status-codes/101) with its own `Upgrade` header naming the protocol it switched to, and the bytes that follow belong to that protocol.

In API work, `Upgrade` means one thing: the [WebSocket](/specifications/websocket) opening handshake from RFC 6455. It is an HTTP/1.1-only mechanism. HTTP/2 deliberately does not support `101` (RFC 9113 Section 8.6), HTTP/3 does not support the upgrade mechanism at all (RFC 9114 Section 4.5), and both treat an `Upgrade` header as a malformed, connection-specific field.

## API Usage & Best Practices

* **Pair it with Connection**: `Upgrade` is hop-by-hop. A sender MUST also list `upgrade` in the [`Connection`](/headers/connection) header so intermediaries know not to forward it. If your WebSocket handshake works locally but fails behind a proxy or load balancer, the usual cause is a hop that strips these two headers instead of passing the upgrade through; configure the proxy to forward them explicitly.
* **The client cannot insist**: A server MAY ignore `Upgrade` and respond on the current protocol. It MUST NOT switch to a protocol the client did not offer.
* **Use 426 to require it**: If an endpoint only speaks the upgraded protocol, respond with [`426 Upgrade Required`](/status-codes/426), which MUST carry an `Upgrade` header listing the acceptable protocols. A server can also send `Upgrade` on any other response to advertise support.
* **WebSockets over HTTP/2 and HTTP/3 use extended CONNECT instead**: RFC 8441 (HTTP/2) and RFC 9220 (HTTP/3) bootstrap WebSockets with a [`CONNECT`](/methods/connect) request carrying a `:protocol` pseudo-header, not with `Upgrade`. Client support for this varies, so keep HTTP/1.1 available on WebSocket routes.
* **Do not use it for HTTP/2**: The `h2c` upgrade from cleartext HTTP/1.1 to HTTP/2 was deprecated by RFC 9113. HTTP/2 is negotiated through TLS ALPN, or used by prior knowledge over cleartext.
* **Requests from HTTP/1.0 are ignored**: A server MUST ignore an `Upgrade` header received in an HTTP/1.0 request.

## Examples

The WebSocket opening handshake, from RFC 6455:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: http://example.com
Sec-WebSocket-Version: 13
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

An endpoint that only accepts WebSocket connections:

```http
HTTP/1.1 426 Upgrade Required
Upgrade: websocket
Connection: Upgrade
Content-Type: application/problem+json
```
