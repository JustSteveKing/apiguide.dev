---
name: "Sec-WebSocket-Accept"
description: "The server's answer to Sec-WebSocket-Key: a base64 SHA-1 of the key plus a fixed GUID, confirming it accepts the WebSocket connection."
category: "response"
standard: true
relatedCodes: [101]
---

## What is the Sec-WebSocket-Accept header?

The `Sec-WebSocket-Accept` response header is the server's half of the [WebSocket](/specifications/websocket) opening handshake in RFC 6455. It is sent on the [`101 Switching Protocols`](/status-codes/101) response and confirms that the server is willing to start a WebSocket connection.

Its value is computed from the client's [`Sec-WebSocket-Key`](/headers/sec-websocket-key):

1. Take the key exactly as sent, as a string, without base64-decoding it.
2. Append the GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`.
3. Take the SHA-1 hash of the result.
4. Base64-encode the 20-byte hash.

For the key `dGhlIHNhbXBsZSBub25jZQ==`, that gives:

```http
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

The client MUST fail the connection if the header is missing or holds any other value. It MUST NOT appear more than once in a response.

## API Usage & Best Practices

* **Use your framework's implementation.** The computation is four lines, but the details trip people up: hash the key string as received, not its decoded bytes, and base64 the raw digest, not its hex form. Every mainstream WebSocket server library does this for you.
* **SHA-1 is fine here.** The value proves the server read the handshake; it is not protecting anything secret, so SHA-1's collision weakness is irrelevant. Do not "upgrade" it to SHA-256: clients will reject the connection.
* **A wrong value means a broken hop.** If browsers report an invalid `Sec-WebSocket-Accept`, something between client and server is usually rewriting or caching the handshake, or answering it itself. Check proxies and load balancers before the application code.
* **Only send it with a 101.** Any status other than 101 means the handshake did not complete and normal HTTP semantics still apply. A rejected handshake is an ordinary HTTP error response, such as [`401 Unauthorized`](/status-codes/401) or [`403 Forbidden`](/status-codes/403), with no accept header.
* **It is not used over HTTP/2 or HTTP/3.** Extended [`CONNECT`](/methods/connect), defined for HTTP/2 by RFC 8441 and reused for HTTP/3 by RFC 9220, replaces the key and accept exchange with the `:protocol` pseudo-header, and a successful response is a `200`, not a `101`.

## Examples

A complete handshake from RFC 6455, request and response:

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
