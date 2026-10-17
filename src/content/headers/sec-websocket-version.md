---
name: "Sec-WebSocket-Version"
description: "The WebSocket protocol version in the opening handshake. Always 13; a server that disagrees replies with the versions it supports."
category: "both"
standard: true
relatedCodes: [101, 400, 426]
---

## What is the Sec-WebSocket-Version header?

The `Sec-WebSocket-Version` header carries the [WebSocket](/specifications/websocket) protocol version in the opening handshake, as defined in RFC 6455. A client MUST send it, and for RFC 6455 its value MUST be `13`:

```http
Sec-WebSocket-Version: 13
```

Values 9 to 12 were reserved for intermediate drafts and never used. Lower numbers belong to the drafts that preceded the RFC.

The server sends it back only on failure. If the client's version is not one the server understands, the server MUST abort the handshake, send an appropriate HTTP error such as [`426 Upgrade Required`](/status-codes/426), and include `Sec-WebSocket-Version` listing the versions it does understand. In a response the header may appear more than once, which is equivalent to a single comma-separated list; in a request it MUST NOT appear more than once.

## API Usage & Best Practices

* **Accept 13 and nothing else.** No version has followed RFC 6455, and every current browser and client library sends 13. Supporting the pre-RFC drafts buys nothing and re-imports their bugs.
* **Reject a missing or wrong version clearly.** Return [`426 Upgrade Required`](/status-codes/426) or [`400 Bad Request`](/status-codes/400) with `Sec-WebSocket-Version: 13`, so a misconfigured client can see what to send. RFC 6455's own example of this uses `400`.
* **Do not use it to version your API.** It versions the framing protocol, not your messages. Put your message format version in [`Sec-WebSocket-Protocol`](/headers/sec-websocket-protocol) or in the URL.
* **It survives into HTTP/2.** RFC 8441 keeps `Sec-WebSocket-Version` in the extended [`CONNECT`](/methods/connect) request, unlike `Sec-WebSocket-Key`, which it drops.

## Examples

A client requesting a version the server does not support, and the server's answer, adapted from RFC 6455 Section 4.4:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 25
```

```http
HTTP/1.1 400 Bad Request
Sec-WebSocket-Version: 13, 8, 7
```

The same list split across two lines, which means the same thing:

```http
HTTP/1.1 400 Bad Request
Sec-WebSocket-Version: 13
Sec-WebSocket-Version: 8, 7
```

A modern server that supports only RFC 6455:

```http
HTTP/1.1 426 Upgrade Required
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Version: 13
```
