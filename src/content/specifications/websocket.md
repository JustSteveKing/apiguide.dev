---
title: "WebSocket Protocol"
description: "A reference guide to the WebSocket Protocol defined in RFC 6455, covering the HTTP Upgrade handshake, full-duplex framing, subprotocols, and how it compares to SSE and HTTP polling."
currentVersion: "RFC 6455"
officialUrl: "https://www.rfc-editor.org/rfc/rfc6455"
---

## What is the WebSocket Protocol?

The WebSocket Protocol, defined in RFC 6455, provides a full-duplex communication channel over a single TCP connection. Once established, both the client and the server can send messages independently and at any time, without the request/response cycle that governs ordinary HTTP.

WebSocket was designed to work with existing web infrastructure. A connection begins as an HTTP request that is then upgraded to the WebSocket protocol, allowing it to share ports 80 and 443 with regular web traffic. The URI schemes are `ws://` for unencrypted connections and `wss://` for connections over TLS.

It is a good fit for interactive, low-latency applications such as chat, collaborative editing, multiplayer games, and live dashboards where both parties need to push data.

---

## The opening handshake

A WebSocket connection starts with an HTTP/1.1 `GET` request that asks the server to switch protocols. The client includes an `Upgrade: websocket` header and a randomly generated `Sec-WebSocket-Key`.

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
Origin: https://example.com
```

If the server accepts, it responds with status `101 Switching Protocols` and a `Sec-WebSocket-Accept` header. This value is derived by concatenating the client's key with the fixed GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, taking the SHA-1 hash, and Base64-encoding the result. This proves the server understood the request and is not a cached or confused HTTP endpoint.

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```

After the handshake completes, the TCP connection stays open and both sides communicate using the WebSocket framing protocol rather than HTTP.

---

## Data framing

WebSocket transmits data in frames rather than as a continuous byte stream. Each frame carries a small header describing its type and length. The protocol defines an opcode for each frame:

| Opcode | Type            | Purpose                                    |
| ------ | --------------- | ------------------------------------------ |
| 0x0    | Continuation    | Continues a fragmented message             |
| 0x1    | Text            | UTF-8 encoded text payload                 |
| 0x2    | Binary          | Arbitrary binary payload                   |
| 0x8    | Close           | Initiates the closing handshake            |
| 0x9    | Ping            | Heartbeat, expects a Pong in response      |
| 0xA    | Pong            | Response to a Ping (or unsolicited keep-alive) |

Key framing rules from RFC 6455:

- Every frame from a client to a server must be masked with a 32-bit masking key. Server-to-client frames must not be masked. Masking mitigates certain proxy cache-poisoning attacks.
- A message may be split across multiple frames using the FIN bit and continuation frames.
- Ping and Pong frames provide a heartbeat mechanism to detect dead connections and keep intermediaries from closing idle connections.
- The closing handshake uses a Close frame that may include a status code and reason, allowing an orderly shutdown from either side.

---

## Subprotocols and extensions

WebSocket itself only defines how to move frames. The meaning of the payload is left to an application-level subprotocol. The client advertises the subprotocols it supports with `Sec-WebSocket-Protocol` during the handshake, and the server selects one by echoing it in its response.

Registered examples include `wamp` and MQTT-over-WebSocket. Extensions, negotiated with `Sec-WebSocket-Extensions`, can alter the framing itself; the most common is `permessage-deflate`, which compresses message payloads.

```javascript
const socket = new WebSocket("wss://server.example.com/chat", ["chat", "superchat"]);

socket.onopen = () => socket.send(JSON.stringify({ type: "join", room: "general" }));
socket.onmessage = (event) => console.log("received:", event.data);
socket.onclose = (event) => console.log("closed:", event.code, event.reason);
```

---

## Comparison with SSE and HTTP polling

| Aspect             | WebSocket                  | Server-Sent Events        | HTTP polling               |
| ------------------ | -------------------------- | ------------------------- | -------------------------- |
| Direction          | Full-duplex                | Server to client only     | Client-initiated only      |
| Underlying protocol| Upgraded from HTTP         | Plain HTTP                 | Plain HTTP                 |
| Payload types      | Text and binary            | UTF-8 text only            | Any                        |
| Latency            | Low, persistent            | Low, persistent            | Higher, per-request        |
| Auto reconnect     | Manual                     | Built in (`EventSource`)  | Inherent (new request)     |
| Overhead per message | Minimal frame header     | Minimal                    | Full HTTP headers each time |

Choose WebSocket when both sides need to send data frequently or when binary transport matters. Prefer SSE for simple one-way server push over standard HTTP. Polling remains a compatible fallback where persistent connections cannot be used.

---

## Scaling considerations

WebSocket connections are stateful and long-lived, which changes how you operate a service:

- Each open connection consumes a file descriptor and memory on the server, so capacity planning is about concurrent connections, not requests per second.
- Because connections are sticky, load balancers must support the HTTP Upgrade mechanism and typically use connection-aware routing.
- Horizontal scaling requires a way to fan out messages across nodes, commonly a pub/sub backplane such as Redis or a message broker, since a given client is connected to only one instance.
- Use Ping/Pong heartbeats and sensible idle timeouts to reclaim resources from dead connections.
- Terminate TLS with `wss://` in production and validate the `Origin` header to guard against cross-site WebSocket hijacking.
