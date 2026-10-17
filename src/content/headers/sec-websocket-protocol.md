---
name: "Sec-WebSocket-Protocol"
description: "Negotiates the application subprotocol for a WebSocket connection: the client lists what it speaks, the server picks one."
category: "both"
standard: true
relatedCodes: [101]
reference:
  title: "RFC 6455"
  url: https://www.rfc-editor.org/rfc/rfc6455.html
updatedDate: 2026-10-17
---

## What is the Sec-WebSocket-Protocol header?

The `Sec-WebSocket-Protocol` header negotiates the subprotocol of a [WebSocket](/specifications/websocket) connection, as defined in RFC 6455. WebSocket only moves frames; the subprotocol says what the messages in them mean.

* **The client** may send one or more subprotocol names, comma-separated, in order of preference. Each must be a token and unique. The header may appear more than once in a request, which is equivalent to one header with all the values.
* **The server** either picks exactly one of the offered values and echoes it, or sends no header at all, meaning no subprotocol. It MUST NOT send a value the client did not offer, and it MUST NOT appear more than once in a response. An empty value is not the same as no header and is not legal.

```http
Sec-WebSocket-Protocol: chat, superchat
```

In browsers, the list comes from the second argument to `new WebSocket(url, protocols)`, and the chosen value is exposed as `socket.protocol`.

## API Usage & Best Practices

* **Answer the client, or the browser will hang up.** RFC 6455 only requires a client to fail when the server picks something it did not offer. The WHATWG WebSockets standard goes further: if the page requested any subprotocols and the response has no `Sec-WebSocket-Protocol`, the browser fails the connection. If you accept the connection, echo one of the offered values.
* **Use it to version your message format.** A name such as `v2.events.example.com` lets old and new clients share an endpoint, and the server can refuse a version it no longer supports by not selecting it. That is cleaner than a version field in every message.
* **Prefer registered names for standard protocols.** IANA's WebSocket Subprotocol Name Registry lists names such as `mqtt` and `wamp`. For your own protocol, use a name you control, such as a domain-based one, so it cannot collide.
* **Do not smuggle tokens through it unless you must.** Browsers cannot set [`Authorization`](/headers/authorization) on a WebSocket handshake, and putting a bearer token in a subprotocol value is a common workaround. If you do, the server still has to echo one of the offered values, so the client must offer a real subprotocol alongside the token and the server must echo that, never the token. The token also ends up in the same logs as every other header. A short-lived, single-use ticket obtained over a normal authenticated request is the safer pattern.
* **The same header works over HTTP/2 and HTTP/3.** RFC 8441 keeps `Sec-WebSocket-Protocol` in the extended [`CONNECT`](/methods/connect) request and response, and RFC 9220 carries the same mechanism over to HTTP/3.

## Examples

A client offering two subprotocols:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
```

The server selecting one:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```
