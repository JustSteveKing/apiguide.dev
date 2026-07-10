---
title: "HTTP/3 (RFC 9114)"
description: "A reference guide to HTTP/3 as defined in RFC 9114, the version of HTTP that runs over QUIC to eliminate transport-layer head-of-line blocking, with QPACK header compression, 0-RTT, connection migration, and Alt-Svc discovery."
currentVersion: "RFC 9114"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9114.html"
---

## What is HTTP/3?

HTTP/3 is the third major version of the HTTP transport, standardized in RFC 9114 in June 2022. Like HTTP/2, it preserves the semantics defined in RFC 9110, but it makes a fundamental change to what it runs on: instead of TCP, HTTP/3 runs over QUIC, a transport protocol built on UDP.

The motivation is the transport-layer head-of-line blocking inherent in HTTP/2. Because HTTP/2 multiplexes all its streams over a single TCP connection, the loss of one TCP segment stalls every stream until retransmission. QUIC solves this by providing independent streams at the transport layer, so a lost packet only affects the stream it belongs to.

HTTP/3 keeps the concepts introduced by HTTP/2, multiplexed streams, binary framing, and header compression, but reimplements them on top of QUIC's capabilities.

---

## Running over QUIC

QUIC, defined in RFC 9000, is a transport protocol that runs over UDP and integrates several features that TCP handles separately or not at all.

| Capability            | TCP + TLS                     | QUIC                              |
| --------------------- | ----------------------------- | -------------------------------- |
| Transport base        | TCP                           | UDP                              |
| Encryption            | TLS layered on top            | TLS 1.3 built in and mandatory   |
| Stream multiplexing   | Not in TCP (added by HTTP/2)  | Native, independent streams      |
| Handshake             | TCP + TLS round trips         | Combined, fewer round trips      |
| Connection identity   | 4-tuple of IPs and ports      | Connection ID, independent of path |

Because QUIC provides independent streams natively, HTTP/3 does not suffer the transport-layer head-of-line blocking that limits HTTP/2. A packet loss on one stream leaves the others free to make progress.

---

## QPACK header compression

HTTP/2's HPACK relies on headers arriving in order, an assumption that holds on a single ordered TCP stream but not on QUIC's independently delivered streams. HTTP/3 therefore uses QPACK, defined in RFC 9204, a header compression scheme designed for out-of-order delivery.

QPACK keeps HPACK's core ideas, a static table, a dynamic table, and Huffman coding, but separates the encoder and decoder state updates onto dedicated unidirectional streams. This lets the encoder control how much it depends on dynamic-table state that might not yet have arrived, trading a small amount of compression efficiency for robustness against head-of-line blocking in the compression itself.

---

## Faster connection setup and 0-RTT

QUIC combines the transport and cryptographic handshakes, so a new connection is established in fewer round trips than TCP followed by a separate TLS handshake. This reduces the latency cost of opening a connection.

QUIC also supports 0-RTT resumption. When a client has connected to a server before, it can send application data in its very first flight of packets, before the handshake completes, using cached parameters.

```http
:method: GET
:scheme: https
:authority: api.example.com
:path: /catalog
```

The tradeoff is that 0-RTT data is vulnerable to replay attacks, so it should only carry safe, idempotent requests such as GET. Servers must be prepared to reject or limit early data for operations with side effects.

---

## Connection migration

A TCP connection is bound to the four-tuple of source and destination IP addresses and ports. If a client's network path changes, for example a phone switching from Wi-Fi to cellular, the TCP connection breaks and must be reestablished.

QUIC identifies a connection by a Connection ID rather than by the network path. This allows *connection migration*: the connection can survive a change of IP address or port and continue without a new handshake. For mobile clients that frequently change networks, this avoids costly reconnections and interruptions.

---

## Discovery with Alt-Svc

A client cannot assume a server speaks HTTP/3, and QUIC uses UDP, which some networks block. HTTP/3 is therefore typically discovered rather than requested directly. A server advertises HTTP/3 support using the `Alt-Svc` header field on an HTTP/1.1 or HTTP/2 response.

```http
HTTP/1.1 200 OK
Content-Type: text/html
Alt-Svc: h3=":443"; ma=86400
```

The `h3` token indicates HTTP/3 availability, the value gives the port, and `ma` sets how long, in seconds, the client may remember this alternative. On subsequent connections the client can attempt HTTP/3 over QUIC, falling back to HTTP/2 over TCP if UDP is unavailable. The HTTPS DNS resource record can also advertise HTTP/3 support before the first connection is made.

---

## Comparison with HTTP/2

| Aspect                     | HTTP/2 (RFC 9113)         | HTTP/3 (RFC 9114)             |
| -------------------------- | ------------------------- | ---------------------------- |
| Transport                  | TCP                       | QUIC over UDP                |
| Encryption                 | TLS, effectively required | TLS 1.3, mandatory in QUIC   |
| Header compression         | HPACK                     | QPACK                        |
| Transport-layer HOL blocking | Present                  | Eliminated                   |
| Connection setup           | TCP then TLS handshakes   | Combined, with 0-RTT option  |
| Connection migration       | Not supported             | Supported via Connection ID  |
| Discovery                  | ALPN during TLS           | Alt-Svc / HTTPS DNS record, then QUIC |

HTTP/3 delivers its biggest gains on networks with loss or latency and on mobile clients that change networks. Where UDP is blocked or connections are stable and short, the benefit over a well-tuned HTTP/2 deployment is smaller, which is why the two coexist with automatic fallback.
