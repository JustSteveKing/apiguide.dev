---
name: "Sec-WebSocket-Extensions"
description: "Negotiates WebSocket protocol extensions such as permessage-deflate: the client offers, the server accepts a subset."
category: "both"
standard: true
relatedCodes: [101]
---

## What is the Sec-WebSocket-Extensions header?

The `Sec-WebSocket-Extensions` header negotiates protocol-level extensions for a [WebSocket](/specifications/websocket) connection, as defined in RFC 6455 Section 9.1. Unlike a subprotocol, which gives meaning to messages, an extension changes the framing or the payload itself, for example by compressing it.

The client offers extensions in order of preference, each a registered token with optional `;`-separated parameters:

```http
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits
```

The server accepts by echoing the extensions it will use, which MUST be drawn from the client's offer, with parameters as each extension defines. The list in the server's response is what is actually in use, and its order is the order the extensions are applied to the data. A client offering an extension MUST NOT use it unless the server accepts it, and MUST fail the connection if the server names one it did not offer.

In a request the header may appear more than once, which is the same as one combined list. In a response it MUST NOT appear more than once.

## API Usage & Best Practices

* **`permessage-deflate` is the one that matters.** Defined in RFC 7692, it compresses each message with DEFLATE. Its four parameters, `server_no_context_takeover`, `client_no_context_takeover`, `server_max_window_bits` and `client_max_window_bits`, trade compression ratio for memory per connection. Browsers offer it by default; the WHATWG WebSockets standard has them send a `permessage-deflate` offer on every connection.
* **Bound the memory before you enable it.** Each connection with context takeover keeps a compression window in memory for its lifetime. On a server holding many idle connections, accept with `server_no_context_takeover` or a smaller `server_max_window_bits` and measure before you accept the default.
* **Think about secrets in compressed messages.** Compression applied to a message that mixes attacker-influenced data with a secret can leak the secret through message sizes, the same class of attack as CRIME, which RFC 7692's security considerations cite. Do not compress messages that carry tokens next to user-controlled content.
* **Never accept an extension you were not offered.** The client will fail the connection, and it is a protocol violation besides.
* **Unknown offers are not an error.** A server that does not support an offered extension simply leaves it out of the response. Do not reject the handshake because of it.
* **It works the same over HTTP/2.** RFC 8441 carries `Sec-WebSocket-Extensions` in the extended [`CONNECT`](/methods/connect) request and response, and its own example offers `permessage-deflate`.

## Examples

A client offering `permessage-deflate` twice, with a fallback, from RFC 7692 Section 7.1.3:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits; server_max_window_bits=10, permessage-deflate; client_max_window_bits
```

The server accepting the first offer:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Extensions: permessage-deflate; server_max_window_bits=10
```
