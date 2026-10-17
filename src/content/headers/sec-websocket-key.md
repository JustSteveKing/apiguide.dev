---
name: "Sec-WebSocket-Key"
description: "A random base64 nonce in the WebSocket opening handshake, which the server hashes into Sec-WebSocket-Accept to prove it understood the request."
category: "request"
standard: true
relatedCodes: [101, 400]
reference:
  title: "RFC 6455"
  url: https://www.rfc-editor.org/rfc/rfc6455.html
updatedDate: 2026-10-17
---

## What is the Sec-WebSocket-Key header?

The `Sec-WebSocket-Key` request header is part of the [WebSocket](/specifications/websocket) opening handshake defined in RFC 6455. The client MUST send it, and its value MUST be a randomly selected 16-byte value, base64-encoded, chosen fresh for each connection. That always produces a 24-character string ending in `==`.

```http
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

The server does not decode it. It appends the fixed GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` to the key exactly as received, takes the SHA-1 hash, base64-encodes it, and returns the result in [`Sec-WebSocket-Accept`](/headers/sec-websocket-accept) on its [`101 Switching Protocols`](/status-codes/101) response.

The point, in RFC 6455's words, is to prove the server received a WebSocket handshake, so a WebSocket server cannot be tricked into accepting a connection from something that is not a WebSocket client, such as a crafted form submission or `XMLHttpRequest`. The header MUST NOT appear more than once in a request.

## API Usage & Best Practices

* **It is not authentication and not a secret.** Anyone can generate a key and compute the matching accept value. Authenticate the handshake request with its credentials and authorize the connection on the server, as you would any other request.
* **Check `Origin` yourself.** Browsers do not apply CORS to WebSocket connections, so a page on any site can open one to your API and the browser will attach your cookies. Validate the [`Origin`](/headers/origin) header in the handshake against an allowlist, or do not use cookie authentication for WebSockets.
* **Browsers set it, scripts cannot.** Header names starting with `Sec-` are forbidden request headers in the Fetch standard, so page JavaScript cannot set or forge this header. That is the reason for the prefix.
* **Let your library generate it.** If you implement a client, the nonce must be random per connection. Reusing a fixed key is a protocol violation, even if many servers will accept it.
* **Reject a malformed key.** A key that does not decode to 16 bytes, or a handshake with more than one key, is not a valid WebSocket handshake. Answer with [`400 Bad Request`](/status-codes/400) rather than upgrading.
* **It does not exist over HTTP/2 or HTTP/3.** RFC 8441 bootstraps WebSockets over HTTP/2 with an extended [`CONNECT`](/methods/connect) request and says implementations do not process `Sec-WebSocket-Key` and `Sec-WebSocket-Accept` there, because the `:protocol` pseudo-header supersedes them. RFC 9220 uses the same mechanism for HTTP/3. See [`Upgrade`](/headers/upgrade).

## Examples

The client side of the opening handshake from RFC 6455:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: http://example.com
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
```

The server's acceptance, with the accept value derived from that key:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```
