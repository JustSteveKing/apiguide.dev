---
title: "Server-Sent Events (SSE)"
description: "A practical guide to Server-Sent Events, the HTML standard for one-way server-to-client streaming over a single long-lived HTTP connection using the text/event-stream media type."
currentVersion: "WHATWG Living Standard"
officialUrl: "https://html.spec.whatwg.org/multipage/server-sent-events.html"
---

## What is Server-Sent Events?

Server-Sent Events (SSE) is a standard that lets a server push a continuous stream of updates to a client over a single, long-lived HTTP connection. It is defined by the WHATWG HTML Living Standard and is built on ordinary HTTP, so it works through existing proxies, load balancers, and firewalls without special handling.

Unlike WebSocket, SSE is strictly one-way: data flows from server to client only. The client subscribes once, and the server sends events as they occur. This makes SSE a natural fit for notifications, live feeds, progress updates, and streaming token output from language models.

The transport uses the `text/event-stream` media type. The browser-side API is `EventSource`, which handles connection management and automatic reconnection for you.

---

## The event stream format

An SSE response is a stream of UTF-8 encoded text. Each event is a block of one or more fields, and events are separated by a blank line. The defined fields are `data`, `event`, `id`, and `retry`. Lines beginning with a colon are comments and are ignored.

```http
GET /stream HTTP/1.1
Host: api.example.com
Accept: text/event-stream

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

: this is a comment and is ignored

data: A single-line message

event: userMessage
id: 42
data: {"user":"alice","text":"hello"}

retry: 10000
data: reconnect interval updated to 10 seconds
```

Field meanings:

| Field   | Purpose                                                                 |
| ------- | ---------------------------------------------------------------------- |
| `data`  | The message payload. Multiple `data:` lines are concatenated with `\n`. |
| `event` | A custom event type. Defaults to `message` when omitted.                |
| `id`    | The event ID. Sets the connection's last event ID for reconnection.    |
| `retry` | The reconnection time in milliseconds the client should wait.           |

Multi-line payloads are expressed by repeating the `data` field. The following delivers a two-line message:

```http
data: first line
data: second line
```

---

## Reconnection and Last-Event-ID

SSE has built-in resilience. When a connection drops, the client automatically reconnects after the retry interval (default is implementation-defined, commonly a few seconds, and can be set with the `retry` field).

On reconnection, the client sends the ID of the last event it received in the `Last-Event-ID` request header. The server can use this to resume the stream from where it left off, avoiding gaps.

```http
GET /stream HTTP/1.1
Host: api.example.com
Accept: text/event-stream
Last-Event-ID: 42
```

The client's last event ID is only updated by events that carry an `id` field, so servers that want resumable streams should assign IDs to their events.

---

## The EventSource API

On the client, the `EventSource` interface consumes a stream and dispatches events. It manages reconnection automatically.

```javascript
const source = new EventSource("/stream");

// The default event type is "message"
source.onmessage = (event) => {
  console.log("data:", event.data);
};

// Listen for a custom event type set via the event: field
source.addEventListener("userMessage", (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload.user, payload.text);
});

source.onerror = (err) => {
  // The browser will attempt to reconnect automatically
  console.error("stream error", err);
};
```

By default `EventSource` does not send credentials cross-origin. Pass `{ withCredentials: true }` to include cookies on cross-origin requests, and configure CORS accordingly on the server.

---

## Comparison with WebSocket and long-polling

| Aspect              | Server-Sent Events        | WebSocket                    | Long-polling               |
| ------------------- | ------------------------- | ---------------------------- | -------------------------- |
| Direction           | Server to client only     | Full-duplex                  | Server to client (per poll) |
| Protocol            | Plain HTTP                | Upgraded protocol (ws/wss)   | Plain HTTP                 |
| Data format         | UTF-8 text only           | Text or binary               | Any                        |
| Auto reconnect      | Built in                  | Manual                       | Manual (new request each time) |
| Resume after drop   | `Last-Event-ID`           | Application-defined          | Application-defined        |
| Proxy friendliness  | High                      | Sometimes problematic        | High                       |
| Browser API         | `EventSource`             | `WebSocket`                  | `fetch` / `XMLHttpRequest` |

SSE is the simplest choice when you only need server-to-client updates over standard HTTP. Choose WebSocket when the client must also send frequent messages or when binary payloads are required. Long-polling remains a fallback where neither is available.

---

## Practical considerations

- SSE carries only UTF-8 text. Binary data must be encoded, for example as Base64.
- Over HTTP/1.1, browsers limit the number of concurrent connections per origin (commonly six), which can starve other requests. HTTP/2 multiplexing largely removes this concern.
- Disable response buffering and compression on intermediaries that would otherwise hold back the stream.
- Send periodic comment lines (`: keep-alive`) to keep idle connections and proxies from timing out.
- Set `Cache-Control: no-cache` so responses are not stored, and keep the connection alive for the duration of the stream.
