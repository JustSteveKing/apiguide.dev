---
name: "Priority"
description: "Signals how urgent a response is and whether it can be used incrementally, so HTTP/2 and HTTP/3 servers can schedule bandwidth."
category: "both"
standard: true
relatedCodes: []
reference:
  title: "RFC 9218"
  url: https://www.rfc-editor.org/rfc/rfc9218.html
updatedDate: 2026-10-17
---

## What is the Priority header?

The `Priority` header, defined in [RFC 9218](https://www.rfc-editor.org/rfc/rfc9218.html) (Extensible Prioritization Scheme for HTTP), tells a server how the client would like the response scheduled relative to the other responses on the same connection. It matters wherever many requests share one connection, which in practice means [HTTP/2](/specifications/http2) and [HTTP/3](/specifications/http3).

It is a [Structured Field](/specifications/structured-fields) Dictionary with two parameters:

| Parameter | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `u` | Integer, 0 to 7 | `3` | Urgency. Lower is more urgent. `7` is meant for background work such as software updates. |
| `i` | Boolean | false (`?0`) | Incremental. The client can use the response as it arrives, so responses of equal urgency may share bandwidth instead of being sent one after another. |

Unknown parameters and out-of-range values are ignored. In a request, an omitted parameter means its default.

The field is end-to-end and can appear on both requests and responses. A server can send `Priority` on a response to tell an intermediary, such as a CDN, how it wants that response scheduled; RFC 9218 leaves it to the intermediary how to combine that with the client's signal. To change a priority after the request is sent, clients use the hop-by-hop `PRIORITY_UPDATE` frame in HTTP/2 and HTTP/3; servers never send that frame.

RFC 9218 also deprecated the original HTTP/2 priority tree from RFC 7540, which saw limited and inconsistent deployment. An endpoint signals that it has stopped using the old scheme with the `SETTINGS_NO_RFC7540_PRIORITIES` setting.

## API Usage & Best Practices

* **It is a hint.** RFC 9218 is explicit that priority signals "do not guarantee any particular processing or transmission order", and a server may ignore them. Never use it to enforce fairness between tenants, service levels or rate limits; those belong in your own scheduling and quota logic.
* **Most API clients never need it.** A server-to-server client making one request at a time gets nothing from it. It pays off when one client multiplexes many requests on a single connection and some matter more than others, such as a browser app loading the data for the visible screen alongside prefetches.
* **Mark background work as background.** A sync job, bulk export or prefetch sent with `u=7` lets a cooperating server or CDN serve interactive requests on the same connection first. That is the cheapest, safest use of the field.
* **Set `i` only for responses clients consume progressively.** Newline-delimited JSON, [Server-Sent Events](/specifications/server-sent-events) and similar formats are useful from the first byte. Leave `i` off for a single JSON document, which is useless until it is complete.
* **Do not let it decide capacity across clients.** Each client picks its own urgency, so the value only means something relative to that client's other requests. A gateway that coalesces many clients onto one upstream connection should not let one client's `u=0` starve another's requests; RFC 9218 discusses this under fairness.
* **Forward it unchanged unless you mean to override.** An intermediary that rewrites or adds `Priority` replaces the client's signal for every later hop. If your gateway wants a different priority from its upstream, RFC 9218 lets it keep the header and send a `PRIORITY_UPDATE` on its own connection instead.

## Examples

A background sync request, not urgent and usable as it streams in:

```http
GET /v1/sync?since=2026-10-01T00:00:00Z HTTP/2
Host: api.example.com
Priority: u=7, i
```

The data for the screen the user is looking at, more urgent than the default:

```http
GET /v1/dashboard HTTP/2
Host: api.example.com
Priority: u=1
```

An origin telling the CDN in front of it that an export endpoint should yield to everything else:

```http
HTTP/2 200
Content-Type: application/x-ndjson
Priority: u=6, i
```
