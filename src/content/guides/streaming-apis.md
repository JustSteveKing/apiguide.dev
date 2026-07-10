---
title: "Streaming APIs: SSE, WebSocket & Long-Polling"
description: "Compare Server-Sent Events, WebSocket, and long-polling, with guidance on reconnection, scaling, and when to use each."
category: "core"
---

## Introduction to Streaming APIs

Real-time features push data to clients instead of waiting for them to poll. Three techniques dominate: long-polling, Server-Sent Events (SSE), and WebSocket. They differ in communication direction, protocol overhead, and operational complexity. The right choice depends on whether you need one-way or two-way flow, how frequently updates arrive, and how much scaling machinery you are willing to run. Over HTTP/3, SSE has become an efficient default for one-way streams, while WebSocket remains the standard for full-duplex interaction.

---

## 1. Long-Polling: The Compatibility Fallback

Long-polling simulates push over ordinary HTTP. The client sends a `GET`; the server holds the connection open until data is available or a timeout fires, then responds; the client immediately reconnects and repeats.

```http
GET /v1/notifications/poll?since=1720449600 HTTP/1.1
Host: api.apiguide.dev
```

* **Strengths**: works through virtually any browser, proxy, and firewall using standard HTTP semantics; stateless and simple for infrequent updates.
* **Weaknesses**: each cycle pays the full cost of HTTP headers, which can dominate small payloads; constant connection churn consumes server resources and scales poorly; latency is higher than persistent connections; message ordering can be tricky.

Reserve long-polling as a fallback for restrictive networks, legacy clients, or serverless architectures where updates are infrequent (under roughly one per second). Clients should reconnect with exponential backoff, starting around 1 second and capping near 30 seconds, and servers should hold connections open for a bounded window (a 30-second timeout is typical).

---

## 2. Server-Sent Events: Efficient Unidirectional Streams

SSE lets a server push a stream of events to a client over a single long-lived HTTP connection. It is specified in the HTML Standard, uses the `EventSource` API in the browser, and the `text/event-stream` media type on the server.

```http
GET /v1/prices/stream HTTP/1.1
Host: api.apiguide.dev
Accept: text/event-stream
```

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

id: 42
event: price
data: {"symbol":"ACME","price":128.40}

```

* **Direction**: one-way, server to client. Client-to-server messages must go over separate HTTP requests.
* **Built-in reconnection**: the browser reconnects automatically and sends the `Last-Event-ID` header so the server can resume from the last delivered event. Messages are UTF-8, delimited by a blank line, and a `204 No Content` response tells the client to stop reconnecting.
* **HTTP/3 benefit**: over QUIC, packet loss on one stream no longer blocks others (no transport-level head-of-line blocking), which makes SSE efficient and low-latency. It also sidesteps the six-connection-per-origin limit that constrains SSE on HTTP/1.1.

SSE fits news feeds, stock tickers, notifications, and monitoring dashboards. Scale it horizontally by fanning events out through a message broker such as Redis Pub/Sub, send periodic keep-alive comments to survive idle timeouts, and pass auth tokens via query parameters since `EventSource` cannot set custom headers. See the [Server-Sent Events specification](/specifications/server-sent-events) for the wire format.

---

## 3. WebSocket: The Full-Duplex Standard

WebSocket establishes a true bidirectional channel over a single TCP connection. It starts with an HTTP upgrade handshake, after which either side sends frames with minimal overhead. The protocol is defined by RFC 6455.

```http
GET /v1/chat HTTP/1.1
Host: api.apiguide.dev
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

* **Strengths**: after the handshake, per-message overhead is tiny (roughly 2–14 bytes); ordering is guaranteed; both text and binary payloads are supported; latency is low.
* **Weaknesses**: connections are stateful, so the server must manage each one. Production use demands reconnection logic with exponential backoff and jitter, heartbeats, message queuing during disconnects, and state recovery. Horizontal scaling needs load balancers (ideally with sticky sessions) and a broker such as Redis Pub/Sub to coordinate across instances.

As a rough capacity guide, a single WebSocket server in 2026 handles on the order of 50,000–100,000 concurrent connections and 100K–500K messages per second at sub-50ms p99 latency; a clustered deployment with Redis and load balancing reaches 500K–2M connections and 5M–10M messages per second at under 100ms p99 globally. Memory per connection ranges from tens of KB when idle to several MB for video. See the [WebSocket specification](/specifications/websocket) for framing details.

WebSocket suits chat, multiplayer games, collaborative editing, and trading platforms, anything needing frequent two-way exchange.

---

## 4. Choosing Between Them

| Dimension | Long-Polling | SSE | WebSocket |
| --- | --- | --- | --- |
| Direction | Server to client (via reconnect) | Server to client | Full-duplex |
| Transport | Repeated HTTP requests | One long-lived HTTP connection | Upgraded TCP connection |
| Overhead | High (headers per cycle) | Low after connect | Very low per frame |
| Reconnection | Manual, with backoff | Built in (`Last-Event-ID`) | Manual, must be built |
| Scaling | Poor under load | Broker fan-out | Sticky sessions + broker |
| Best for | Fallback, rare updates | Feeds, tickers, notifications | Chat, games, collaboration |

* **One-way updates**: prefer **SSE over HTTP/3** for its simplicity, HTTP compatibility, and built-in reconnection.
* **Two-way, low-latency, high-frequency**: choose **WebSocket**, accepting the extra engineering for scaling and reliability.
* **Restricted networks or legacy clients**: fall back to **long-polling**, aware of its overhead and scaling limits.

Weigh memory per connection, the impact of network interruptions, and whether a managed service is cheaper than building and maintaining real-time infrastructure yourself. For request/response operations that merely take a while, an [async operations](/guides/async-operations) pattern is often simpler than any streaming transport.
