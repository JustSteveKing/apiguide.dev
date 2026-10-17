---
title: "HTTP/1.1 (RFC 9112)"
description: "A reference guide to HTTP/1.1 as defined in RFC 9112, covering the text message format, request-target forms, message body length, chunked transfer coding, persistent connections and pipelining, and the framing rules that defend against request smuggling."
currentVersion: "RFC 9112"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9112.html"
updatedDate: 2026-10-14
---

## What is HTTP/1.1?

RFC 9112, published in June 2022 as Internet Standard STD 99, defines the HTTP/1.1 wire format: how a message is laid out as text on a connection, how its length is determined, and how connections are kept open and closed. HTTP/1.1 was first standardized in RFC 2068 in 1997, revised as RFC 2616, and then split into the RFC 7230 series. RFC 9112 obsoletes RFC 7230.

It is now deliberately narrow. Everything about what HTTP *means* (methods, status codes, most header fields, content negotiation) moved to [HTTP Semantics (RFC 9110)](/specifications/http-semantics), and caching lives in [HTTP Caching (RFC 9111)](/specifications/http-caching). RFC 9112 keeps only what is specific to the HTTP/1.1 syntax, the same layer that [HTTP/2](/specifications/http2) and [HTTP/3](/specifications/http3) replace with binary framing.

If the question is "what does `409` mean", the answer is in RFC 9110 for every version. If it is "where does this message end", the answer is in RFC 9112, for HTTP/1.1 only.

---

## 1. Message format

A message is a start line, zero or more field lines, an empty line, and an optional body. Every line ends in CRLF.

```http
POST /orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 28

{"sku":"A-100","quantity":2}
```

The start line is a request line (method, request target, version) or a status line (version, status code, optional reason phrase). A client MUST send [`Host`](/headers/host) in every HTTP/1.1 request, and a server MUST answer [`400 Bad Request`](/status-codes/400) to a request with no `Host`, more than one, or an invalid one.

The request target takes one of four forms:

| Form | Example | Used for |
| :--- | :--- | :--- |
| origin-form | `/orders?status=open` | Ordinary requests to an origin server |
| absolute-form | `http://api.example.com/orders` | Requests to a forward proxy |
| authority-form | `api.example.com:443` | [`CONNECT`](/methods/connect) only |
| asterisk-form | `*` | Server-wide [`OPTIONS`](/methods/options) only |

RFC 9112 tightened parsing in ways that exist to close security holes. Messages are parsed as octets, not Unicode strings. Whitespace between a field name and its colon is forbidden, and a server MUST reject it with `400`. Bare CR characters are prohibited outside the body. Line folding (continuing a field value on an indented line) is obsolete; a server must reject it or replace it with spaces.

---

## 2. Message body length

HTTP/1.1 has no frame boundaries, so the receiver must work out where a body ends from the headers. Section 6.3 sets the order of precedence:

1. Responses to `HEAD`, and `1xx`, [`204`](/status-codes/204) and [`304`](/status-codes/304) responses, never have a body.
2. A `2xx` response to `CONNECT` turns the connection into a tunnel.
3. If [`Transfer-Encoding`](/headers/transfer-encoding) is present, it overrides [`Content-Length`](/headers/content-length). A message with both "ought to be handled as an error".
4. With `chunked` as the final transfer coding, the body is read chunk by chunk until the zero-length chunk.
5. An invalid `Content-Length` is an unrecoverable framing error: `400` for a request, [`502`](/status-codes/502) from a proxy for a response.
6. A valid `Content-Length` gives the length in octets.
7. A request with neither has no body.
8. A response with neither runs until the server closes the connection.

A server MAY refuse a body without `Content-Length` with [`411 Length Required`](/status-codes/411). A sender MUST NOT send `Content-Length` in any message that has `Transfer-Encoding`.

---

## 3. Chunked transfer coding

Chunked coding lets a sender stream a body of unknown length without closing the connection. Each chunk is its size in hexadecimal, CRLF, the data, CRLF. A chunk of size zero ends the body, optionally followed by trailer fields.

```http
HTTP/1.1 200 OK
Content-Type: application/x-ndjson
Transfer-Encoding: chunked

e
{"event":"a"}

e
{"event":"b"}

0

```

`e` is hexadecimal for 14: each chunk's data is the JSON plus its own trailing newline, and the CRLF that closes the chunk shows as the blank line after it. Every HTTP/1.1 recipient MUST be able to decode chunked. A sender MUST NOT chunk twice, and if any other transfer coding is applied to a request, `chunked` MUST be last. `Transfer-Encoding` is a hop-by-hop property of the message; compress the representation with [`Content-Encoding`](/headers/content-encoding) instead of `Transfer-Encoding: gzip`.

Chunked coding does not exist in HTTP/2 or HTTP/3, whose frames already delimit data. A proxy translating between versions removes it.

---

## 4. Persistent connections

HTTP/1.1 connections persist by default. The [`Connection`](/headers/connection) header carries connection options for the current hop only, and `Connection: close` from either side means the connection ends after the current response. HTTP/1.0 connections close by default unless both sides agree to `keep-alive`.

To reuse a connection, every message on it must be self-delimiting. A server MUST read the whole request body or close the connection after responding; otherwise the unread bytes would be parsed as the next request.

**Pipelining** lets a client send several requests without waiting for responses. The server MUST return responses in request order, so one slow response blocks everything behind it: HTTP-layer head-of-line blocking. A client SHOULD NOT pipeline after a non-idempotent request until its response arrives. The usual workaround is several parallel connections; earlier revisions capped how many, and RFC 9112 drops the number and only asks clients to be conservative. HTTP/2 multiplexing is the real fix.

---

## 5. Request smuggling

Request smuggling exploits two parsers disagreeing about where a message ends. A front-end proxy reads the body length from `Content-Length` while the back end honors `Transfer-Encoding: chunked`, or the reverse; the bytes one thinks are body, the other parses as a new request on the shared connection. The hidden request bypasses whatever the proxy enforces.

RFC 9112's framing rules exist to stop this:

- A server MAY reject a request carrying both `Content-Length` and `Transfer-Encoding`, or process it using `Transfer-Encoding` alone, and either way MUST close the connection afterward.
- An intermediary that forwards such a message MUST remove `Content-Length` first.
- A request whose final transfer coding is not `chunked` gets `400` and a closed connection.
- A transfer coding the server does not understand gets [`501 Not Implemented`](/status-codes/501).
- `Transfer-Encoding` in an HTTP/1.0 message means the framing is faulty and the connection must close.

The defense is consistency, not cleverness. Reject ambiguous framing at the edge, never forward both headers, and keep front end and back end on parsers that follow RFC 9112 exactly. Speaking HTTP/2 end to end between proxy and origin removes this class of bug, because HTTP/2 frames carry their own lengths, but a proxy that downgrades HTTP/2 to HTTP/1.1 toward the origin reintroduces it.

---

## 6. When HTTP/1.1 still matters

Even when your edge negotiates HTTP/2 or HTTP/3, HTTP/1.1 is the common denominator behind it: proxies and load balancers often speak it to origins, `curl` uses it by default for cleartext `http://` URLs, and a WebSocket connection starts life as an HTTP/1.1 request that is answered with [`101 Switching Protocols`](/status-codes/101) and an [`Upgrade`](/headers/upgrade) header. Its framing rules are where the subtle bugs are, so they are worth knowing whatever your clients speak.
