---
name: "Transfer-Encoding"
description: "Lists the transfer codings, such as chunked, applied to an HTTP/1.1 message body so it can be framed on the connection."
category: "both"
standard: true
relatedCodes: [400, 501]
reference:
  title: "RFC 9112, Section 6.1"
  url: https://www.rfc-editor.org/rfc/rfc9112.html#section-6.1
updatedDate: 2026-10-14
---

## What is the Transfer-Encoding header?

The `Transfer-Encoding` header lists the transfer codings applied to a message body in order to frame it on the wire. It is defined in RFC 9112 (HTTP/1.1, Section 6.1) and exists only in [HTTP/1.1](/specifications/http1-1). Its one value that matters in practice is `chunked`, which lets a sender stream a body of unknown length as a series of size-prefixed chunks ending in a zero-length chunk, optionally followed by trailer fields.

Unlike [`Content-Encoding`](/headers/content-encoding), a transfer coding is a property of the hop, not of the representation: each HTTP/1.1 connection can frame the same body differently, and intermediaries remove and reapply it. HTTP/2 and HTTP/3 have their own framing, and RFC 9113 and RFC 9114 both list `Transfer-Encoding` as a connection-specific field that must not appear in those protocols; a message that contains it is malformed.

## API Usage & Best Practices

* **Let the framework set it**: Your application code should almost never write this header. Servers and HTTP libraries choose between [`Content-Length`](/headers/content-length) and `chunked` based on whether the body length is known. Streamed responses, such as [server-sent events](/specifications/server-sent-events) or large exports over HTTP/1.1, go out chunked automatically.
* **Never send both framings**: A message carrying both `Transfer-Encoding` and `Content-Length` is the classic request smuggling vector: if a front-end proxy honors one and the back end honors the other, an attacker can hide a second request inside the first. RFC 9112 says `Transfer-Encoding` overrides `Content-Length`, that such a message ought to be handled as an error, and that a server MAY reject it outright. Either way, it MUST close the connection after responding. Reject it at your edge.
* **Chunked must come last on requests**: If a request uses a transfer coding and `chunked` is not the final one, the server MUST respond with [`400 Bad Request`](/status-codes/400) and close the connection, because the body length cannot be determined.
* **Unknown codings get 501**: A server that receives a transfer coding it does not understand SHOULD respond with [`501 Not Implemented`](/status-codes/501).
* **Do not send it where it cannot apply**: A server MUST NOT send `Transfer-Encoding` in a `1xx` or [`204 No Content`](/status-codes/204) response, in a `2xx` response to [`CONNECT`](/methods/connect), or to a client that made an HTTP/1.0 request.
* **Trailers need consent**: A client advertises that it will not discard trailer fields by sending `TE: trailers`. `TE` is the request-side partner of this header, defined in RFC 9110 Section 10.1.4; it is hop-by-hop, so it must be listed in [`Connection`](/headers/connection), and it is the only connection-specific field HTTP/2 and HTTP/3 allow, with `trailers` as its only permitted value there. Do not put critical data in trailers unless you know every hop preserves them.
* **Do not use it for compression**: `gzip` and `deflate` are defined as transfer codings in RFC 9112, but almost nothing negotiates compression per hop. Compress the representation with `Content-Encoding` instead.

## Examples

A chunked HTTP/1.1 response streaming two chunks (sizes are hexadecimal):

```http
HTTP/1.1 200 OK
Content-Type: application/x-ndjson
Transfer-Encoding: chunked

1b
{"id":1,"status":"active"}

1b
{"id":2,"status":"closed"}

0

```

A smuggling-shaped request that an edge server should reject rather than forward:

```http
POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Length: 4
Transfer-Encoding: chunked
```
