---
name: "TE"
description: "Tells the server whether the client accepts trailer fields and, in HTTP/1.1, which transfer codings besides chunked it can take."
category: "request"
standard: true
reference:
  title: "RFC 9110, Section 10.1.4"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.4
updatedDate: 2026-10-17
---

## What is the TE header?

The `TE` request header, defined in Section 10.1.4 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-te), describes the client's capabilities for transfer codings and trailer sections. Its value is a list of members:

* **`trailers`** says the client will not discard trailer fields, on behalf of itself and any downstream clients. It does not promise any particular trailer will be processed, only that the trailer section will not be dropped.
* **A transfer coding name**, with an optional weight and parameters, says the client can accept that transfer coding in the response. Only HTTP/1.1 uses transfer codings, and `chunked` is never listed: it is always acceptable to an HTTP/1.1 recipient, and RFC 9112 says a client MUST NOT send it in `TE`.

```http
TE: trailers
```

`TE` is hop-by-hop. A sender MUST also list `TE` in the [`Connection`](/headers/connection) header so intermediaries do not forward it. In HTTP/2 it is the one connection-specific field allowed in a request, and only with the value `trailers`; RFC 9113 says it MUST NOT contain anything else.

## API Usage & Best Practices

* **Send `TE: trailers` if you need trailers.** A server that wants to put a checksum, a signature or a final status after a streamed body has no way to know the client will keep it unless the client says so. RFC 9110 tells servers not to generate trailers they believe the client must receive, because they can be discarded in transit. See [`Trailer`](/headers/trailer).
* **gRPC requires it.** The gRPC over HTTP/2 protocol has clients send `te: trailers`, which its specification says is used to detect incompatible proxies. gRPC carries its status in trailers, so every proxy in front of a gRPC service has to pass them through. See [gRPC](/specifications/grpc).
* **Do not use it for compression.** Transfer codings such as `gzip` in `TE` are an HTTP/1.1-only, hop-by-hop mechanism. For APIs, compression is negotiated with [`Accept-Encoding`](/headers/accept-encoding) and [`Content-Encoding`](/headers/content-encoding).
* **Never send other values over HTTP/2.** Anything other than `trailers` in an HTTP/2 request is a malformed request.
* **Browsers set it, not scripts.** `TE` is a forbidden request header in the Fetch standard, so browser JavaScript cannot set it.
* **Forward it correctly in proxies.** As a hop-by-hop field, it is not passed on as-is. When an intermediary sends `TE: trailers`, RFC 9110 reads it as a promise on behalf of every downstream client, so only send it upstream if the trailers will actually reach them.

## Examples

An HTTP/1.1 client that accepts trailers, with the required `Connection` option:

```http
GET /v1/exports/exp_9f2/download HTTP/1.1
Host: api.example.com
TE: trailers
Connection: TE
```

The request headers of a gRPC call over HTTP/2, shown as HTTP/2 fields:

```http
:method = POST
:scheme = https
:path = /orders.v1.OrderService/GetOrder
:authority = api.example.com
content-type = application/grpc
te = trailers
```
