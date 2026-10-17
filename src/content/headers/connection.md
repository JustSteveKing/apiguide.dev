---
name: "Connection"
description: "Lists control options for the current HTTP/1.1 connection and names the hop-by-hop fields that intermediaries must strip before forwarding."
category: "both"
standard: true
reference:
  title: "RFC 9110, Section 7.6.1"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-7.6.1
updatedDate: 2026-10-14
---

## What is the Connection header?

The `Connection` header, defined in RFC 9110 Section 7.6.1, carries control options for the current connection only. Each option is a token, such as `close`, `keep-alive` or `upgrade`, and any option that matches a header name marks that header as hop-by-hop: meant for the immediate recipient, not for every hop on the chain. An intermediary MUST parse `Connection` before forwarding, remove every field it names, and then remove or replace `Connection` itself.

It is an HTTP/1.x mechanism. HTTP/2 and HTTP/3 carry connection metadata in their own framing; RFC 9113 Section 8.2.2 and RFC 9114 Section 4.2 forbid `Connection` and the fields it governs (`Keep-Alive`, `Proxy-Connection`, [`Transfer-Encoding`](/headers/transfer-encoding) and [`Upgrade`](/headers/upgrade)), and any message containing them MUST be treated as malformed.

## API Usage & Best Practices

* **Strip hop-by-hop fields in any proxy you write**: A gateway or reverse proxy that copies request headers to the upstream verbatim forwards fields that were never meant for it. Remove `Connection`, every field it lists, and the known hop-by-hop fields (`Keep-Alive`, `Proxy-Connection`, `TE`, `Transfer-Encoding`, `Upgrade`) whether or not they are listed. Translating to HTTP/2 without doing this produces malformed messages that the next hop will reject.
* **Assume clients will abuse the list**: A client controls `Connection`, so it can name any header and have conforming proxies delete it in transit. RFC 9110 says a sender MUST NOT list a field intended for all recipients, such as [`Cache-Control`](/headers/cache-control), but nothing stops an attacker doing so. Add the headers your edge injects for the back end (an authenticated-user header, [`X-Forwarded-For`](/headers/x-forwarded-for)) after hop-by-hop stripping, never before, and have the back end treat their absence as a failure rather than as "no restriction".
* **Use `close` to end the connection cleanly**: `Connection: close` tells the peer the connection will not be reused after this response. Send it when draining a server for shutdown rather than resetting connections mid-request.
* **Do not set it by hand in HTTP/2 or HTTP/3 code**: Frameworks that serve multiple protocols will drop or reject it. Persistence is the default in HTTP/1.1 anyway, so `Connection: keep-alive` is redundant there.
* **List the options that need it**: A sender of `Upgrade` or `TE` MUST also list `upgrade` or `TE` in `Connection`.

## Examples

A WebSocket handshake marks `Upgrade` as hop-by-hop:

```http
GET /v1/stream HTTP/1.1
Host: api.example.com
Connection: Upgrade
Upgrade: websocket
```

A server signaling that it will close the connection after this response:

```http
HTTP/1.1 503 Service Unavailable
Connection: close
Retry-After: 30
Content-Type: application/problem+json
```
