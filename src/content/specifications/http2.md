---
title: "HTTP/2 (RFC 9113)"
description: "A reference guide to HTTP/2 as defined in RFC 9113, covering binary framing, multiplexed streams over a single connection, HPACK header compression, stream prioritization, and the transport-layer head-of-line blocking that HTTP/3 later addressed."
currentVersion: "RFC 9113"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9113.html"
---

## What is HTTP/2?

HTTP/2 is a major revision of the HTTP transport, first standardized in RFC 7540 and revised by RFC 9113 in 2022. It preserves the semantics of HTTP defined in RFC 9110, the same methods, status codes, and header fields, while completely changing how messages are framed and carried over the connection.

The goal of HTTP/2 is performance. HTTP/1.1 sends one request at a time per connection and represents messages as plain text, which leads to inefficiencies at scale. HTTP/2 introduces a binary framing layer that allows many concurrent requests to share a single TCP connection, along with header compression to cut redundant overhead.

Because it keeps the same semantics, an application generally does not need to change to benefit from HTTP/2; the improvements happen at the transport level.

---

## 1. Binary framing

The foundation of HTTP/2 is the binary framing layer. Instead of the newline-delimited text of HTTP/1.1, everything is encoded into binary frames with a fixed nine-octet header describing the frame's length, type, flags, and the stream it belongs to.

Key frame types include:

| Frame          | Purpose                                             |
| -------------- | --------------------------------------------------- |
| HEADERS        | Carries HTTP header fields (compressed with HPACK)  |
| DATA           | Carries message body payload                        |
| SETTINGS       | Communicates configuration parameters between peers |
| WINDOW_UPDATE  | Implements flow control                             |
| RST_STREAM     | Abruptly terminates a single stream                 |
| GOAWAY         | Initiates connection shutdown                        |
| PRIORITY       | Deprecated by RFC 9113; formerly stream priority    |

An HTTP request or response becomes a sequence of frames on a stream, which the peer reassembles into a complete message.

---

## 2. Multiplexed streams

A *stream* is an independent, bidirectional sequence of frames within one connection, identified by a numeric stream identifier. Because each frame is tagged with its stream ID, frames from many streams can be interleaved on a single connection and demultiplexed at the other end.

This multiplexing eliminates the application-layer head-of-line blocking of HTTP/1.1, where one slow response would hold up everything behind it on the connection. It also removes the need for workarounds such as opening many parallel connections or bundling resources into sprite sheets and concatenated files.

```http
:method: GET
:scheme: https
:authority: api.example.com
:path: /users/42
accept: application/json
```

HTTP/2 uses pseudo-header fields, prefixed with a colon, to convey request and response control data such as `:method`, `:path`, `:scheme`, `:authority`, and `:status`. These replace the request line and status line of HTTP/1.1.

---

## 3. HPACK header compression

HTTP requests carry many repetitive headers, cookies, user agents, and accept lists that change little between requests. HTTP/2 compresses them with HPACK, defined in RFC 7541.

HPACK combines a static table of common header fields, a dynamic table that both peers maintain in sync, and Huffman coding for literal values. Frequently sent headers can be represented by a single index into a table rather than being transmitted in full each time. HPACK was designed specifically to resist the compression-based attacks (such as CRIME) that affected generic compression of headers.

---

## 4. Server push and prioritization

HTTP/2 introduced *server push*, which lets a server send a response, paired with a synthetic "promised" request in a PUSH_PROMISE frame, before the client asks for it. RFC 9113 still specifies push (Section 8.4), but says plainly that "in practice, server push is difficult to use effectively", because the server has to predict what the client will request while accounting for caching, content negotiation and user behavior. A client opts out by sending `SETTINGS_ENABLE_PUSH` set to 0; after that is acknowledged, a PUSH_PROMISE is a connection error. Browsers have opted out: Chrome disabled push by default in Chrome 106, with other Chromium-based browsers following.

Do not build on server push. To get the client fetching critical resources early, send [`103 Early Hints`](/status-codes/103) with [`Link`](/headers/link) `rel=preload` headers instead: the client keeps the decision, so it skips anything it already has cached.

*Stream prioritization* allowed a client to express the relative importance of streams so a server could allocate bandwidth accordingly. The original dependency-tree priority scheme was complex and inconsistently implemented; RFC 9113 deprecates it in favor of the simpler scheme in RFC 9218 (Extensible Prioritization).

---

## 5. Head-of-line blocking at the TCP layer

HTTP/2 solves head-of-line blocking at the HTTP layer, but a subtler problem remains at the transport layer. All streams share one TCP connection, and TCP guarantees in-order delivery of its byte stream. If a single TCP segment is lost, TCP holds back all subsequent data until the loss is retransmitted, even data belonging to other, unaffected streams.

The result is that on lossy networks, one dropped packet can stall every multiplexed stream at once. This is TCP-level head-of-line blocking, and it is the primary limitation that motivated HTTP/3, which runs over QUIC and provides independent, per-stream delivery.

---

## 6. Comparing HTTP/1.1, HTTP/2, and HTTP/3

| Aspect                  | HTTP/1.1              | HTTP/2                     | HTTP/3                        |
| ----------------------- | -------------------- | ------------------------- | ---------------------------- |
| Specification           | RFC 9112             | RFC 9113                  | RFC 9114                     |
| Transport               | TCP                  | TCP                       | QUIC (over UDP)             |
| Message format          | Text                 | Binary frames             | Binary frames               |
| Concurrency             | One per connection   | Multiplexed streams       | Multiplexed streams         |
| Header compression      | None                 | HPACK                     | QPACK                       |
| Head-of-line blocking   | HTTP and TCP layers  | TCP layer only            | Eliminated                  |
| Encryption              | Optional (TLS)       | Effectively required by browsers | Mandatory (TLS 1.3 in QUIC) |

HTTP/2 is a substantial step forward from HTTP/1.1 and remains widely deployed. Its one architectural weakness, transport-layer head-of-line blocking, is precisely what HTTP/3 was designed to remove.
