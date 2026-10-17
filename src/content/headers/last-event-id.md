---
name: "Last-Event-ID"
description: "Sent by an EventSource client when it reconnects to a Server-Sent Events stream, carrying the id of the last event it saw."
category: "request"
standard: true
relatedCodes: [200, 204]
reference:
  title: "WHATWG HTML Living Standard"
  url: https://html.spec.whatwg.org/multipage/
updatedDate: 2026-10-17
---

## What is the Last-Event-ID header?

The `Last-Event-ID` request header is defined in Section 9.2.4 of the WHATWG HTML Living Standard, as part of [Server-Sent Events](/specifications/server-sent-events). When an `EventSource` reconnects after its connection drops, it sends the last event ID it has seen, so the server can resume the stream from that point instead of from the beginning or from "now".

The value comes from the stream itself. Each event can carry an `id:` field, and the browser remembers the most recent one as the event source's last event ID string. It is not reset by events without an `id:`, so it stays set until the server sends a new one. An `id:` field with an empty value clears it, and then no `Last-Event-ID` is sent on the next reconnection. A value containing a NULL character is ignored.

```http
Last-Event-ID: 42
```

The spec treats the value as essentially any UTF-8 string without NULL, LF or CR; whatwg/html issue #7363 is open to define its value space more precisely. It is listed in the IANA HTTP Field Name registry as permanent, referencing HTML.

## API Usage & Best Practices

* **Give every event you can replay an `id:`.** Without ids there is nothing to resume from, and a reconnecting client either misses events or receives duplicates. Use something the server can seek on: a sequence number, a log offset, or an opaque cursor that encodes one.
* **Keep a replay window and decide what happens outside it.** Retain enough history to cover a normal reconnection. If the client asks to resume from an id you no longer have, start from now and tell it so with an application event, rather than silently skipping events it will assume it has.
* **Treat it as a cursor, not a credential.** The client controls the header. Validate it, bound its length, and authorize the stream on the request's own credentials, never on the id.
* **It only arrives on automatic reconnection.** The browser sends it when it reestablishes the connection on its own. Calling `new EventSource()` again creates an object whose last event ID is empty. A client that needs to resume after a page reload has to carry the id itself, for example in a query parameter.
* **Use `retry:` and `204` to control reconnection.** A `retry:` field sets the reconnection delay in milliseconds. A `204 No Content` response, or any response that is not [`200 OK`](/status-codes/200) with `text/event-stream`, makes the browser fail the connection and stop reconnecting, which is how a server ends a stream for good. See [`204 No Content`](/status-codes/204).
* **Non-browser clients have to do it themselves.** The behavior above is specified for `EventSource` in browsers. If you write an SSE client in another language, track the last `id:` and send `Last-Event-ID` on reconnect, or you lose the resume behavior the protocol is built around. See [Streaming APIs](/guides/streaming-apis).

## Examples

A stream where each event carries an id:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-store

id: 41
event: order.updated
data: {"id":"ord_123","status":"packed"}

id: 42
event: order.updated
data: {"id":"ord_123","status":"shipped"}
```

The browser's automatic reconnection after the connection drops:

```http
GET /v1/orders/ord_123/events HTTP/1.1
Host: api.example.com
Accept: text/event-stream
Last-Event-ID: 42
```

A server ending the stream permanently, so the client stops reconnecting:

```http
HTTP/1.1 204 No Content
```
