---
name: "Via"
description: "Records each proxy or gateway a message passed through, with the protocol version it was received over."
category: "both"
standard: true
relatedCodes: [502, 504]
reference:
  title: "RFC 9110, Section 7.6.3"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-7.6.3
updatedDate: 2026-10-14
---

## What is the Via header?

The `Via` header, defined in Section 7.6.3 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-via), records the intermediaries a message has passed through. On a request it lists the proxies between the client and the origin; on a response, the ones between the origin and the client. It exists for tracing forwards, detecting request loops, and telling downstream recipients what protocol versions the chain supports.

Each member is a received protocol, the name of the intermediary, and an optional comment:

```http
Via: 1.0 fred, 1.1 p.example.net
```

The protocol name is omitted when it is HTTP, so `1.1` means HTTP/1.1. The version recorded is the one the intermediary **received** the message over, not the one it forwarded with. Each intermediary appends its own entry, so the list reads in forwarding order.

A proxy **must** add a `Via` entry to every message it forwards. An HTTP-to-HTTP gateway (a reverse proxy, a CDN, an API gateway) must add one to inbound requests and may add one to responses.

## API Usage & Best Practices

* **Use it for loop detection in your own gateways.** An API gateway that forwards to another gateway can find its own pseudonym already in the inbound `Via` and refuse the request rather than forwarding it in a circle until something times out.
* **Use pseudonyms, not hostnames.** RFC 9110 lets the received-by part be a pseudonym when the real host is sensitive, and says an intermediary at a firewall boundary should not forward internal names and ports unless configured to. `1.1 edge` tells an operator what they need; `1.1 ip-10-0-3-17.internal:8080` tells an attacker your network layout.
* **Do not put software versions in the comment.** Comments are optional and a recipient may strip them. Advertising `(nginx/1.18.0)` on every response only helps someone matching your stack against known vulnerabilities.
* **Do not use it for client identity.** `Via` names intermediaries, not clients. For the client address, use [`Forwarded`](/headers/forwarded) or [`X-Forwarded-For`](/headers/x-forwarded-for), with the same trusted-proxy discipline either way.
* **Do not branch on it in application logic.** Whether there is a CDN in front of the origin is a deployment detail. An API that behaves differently depending on `Via` breaks the day the infrastructure changes. For what a cache actually did with a response, read [`Cache-Status`](/headers/cache-status), which was designed for that question.
* **Read it when debugging [`502 Bad Gateway`](/status-codes/502) or [`504 Gateway Timeout`](/status-codes/504).** The response's `Via` tells you which intermediaries the response came back through, which narrows down which hop generated the error.

## Examples

A request that arrived at the origin after an HTTP/2 client reached the CDN and the CDN forwarded over HTTP/1.1 to an internal gateway:

```http
GET /v1/orders HTTP/1.1
Host: orders.internal
Via: 2 cdn-edge, 1.1 api-gateway
```

A response passed back through a reverse proxy, with the internal host replaced by a pseudonym:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Via: 1.1 edge
```
