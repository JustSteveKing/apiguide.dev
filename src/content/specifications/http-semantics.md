---
title: "HTTP Semantics (RFC 9110)"
description: "The foundational reference for HTTP, RFC 9110 defines the version-independent semantics of the protocol: methods, status codes, header fields, representations, content negotiation, conditional and range requests, and the authentication framework."
currentVersion: "RFC 9110"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9110.html"
---

## What is HTTP Semantics?

RFC 9110, HTTP Semantics, defines the core, version-independent meaning of the Hypertext Transfer Protocol. It describes what HTTP messages mean regardless of how they are transported, so the same semantics apply across HTTP/1.1, HTTP/2, and HTTP/3.

This separation is deliberate. The semantics, what a `GET` request means, what a `404` status conveys, how content negotiation works, are defined once here. The wire formats and connection management for each version are defined in their own documents. Understanding RFC 9110 is the foundation for understanding every other part of HTTP.

Published in June 2022, it obsoletes the earlier RFC 723x series (RFC 7230 through 7235) and consolidates and clarifies the semantics that were previously spread across those documents.

---

## Methods

A request method tells the server what action to perform on the target resource. RFC 9110 defines the following methods and two important properties: whether a method is *safe* (read-only, no expectation of side effects) and *idempotent* (repeating it has the same effect as making it once).

| Method  | Safe | Idempotent | Purpose                                        |
| ------- | ---- | ---------- | ---------------------------------------------- |
| GET     | Yes  | Yes        | Retrieve a representation of the resource      |
| HEAD    | Yes  | Yes        | Like GET but returns headers only, no body     |
| POST    | No   | No         | Process the enclosed data per resource semantics |
| PUT     | No   | Yes        | Replace the resource with the enclosed representation |
| DELETE  | No   | Yes        | Remove the target resource                     |
| CONNECT | No   | No         | Establish a tunnel to the server               |
| OPTIONS | Yes  | Yes        | Describe the communication options for the resource |
| TRACE   | Yes  | Yes        | Perform a message loop-back test               |

PATCH is not defined in RFC 9110; it is specified separately in RFC 5789.

---

## Status codes

A three-digit status code communicates the result of a request. The first digit places the response in one of five classes.

| Class | Range   | Meaning                                              |
| ----- | ------- | --------------------------------------------------- |
| 1xx   | 100-199 | Informational, request received, continuing process |
| 2xx   | 200-299 | Successful, the request was received and accepted    |
| 3xx   | 300-399 | Redirection, further action is needed to complete    |
| 4xx   | 400-499 | Client error, the request appears to be at fault     |
| 5xx   | 500-599 | Server error, the server failed to fulfill a request |

```http
GET /articles/42 HTTP/1.1
Host: api.example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 51

{"id":42,"title":"HTTP Semantics","published":true}
```

Codes are extensible, but clients are expected to understand the class of any code they do not recognize by its first digit.

---

## Representations and content negotiation

RFC 9110 formalizes the idea of a *representation*: a resource can have multiple representations differing in format, language, or encoding. The message body carries a representation, described by representation header fields such as `Content-Type`, `Content-Language`, and `Content-Encoding`.

Content negotiation lets a client and server agree on the best representation. In *proactive* negotiation the client states its preferences with `Accept` headers and the server selects.

```http
GET /report HTTP/1.1
Host: api.example.com
Accept: application/json, text/csv;q=0.8
Accept-Language: en-GB, en;q=0.7
Accept-Encoding: gzip, br
```

The `q` parameter expresses relative preference from 0 to 1. The server should return `Vary` to indicate which request headers influenced its choice, which is important for caches.

---

## Conditional requests

Conditional requests make an operation depend on the current state of a resource, using validators. RFC 9110 defines two kinds: the strong or weak entity-tag (`ETag`) and the modification date (`Last-Modified`).

Precondition header fields test these validators before the server acts:

| Header                | Tests against | Common use                          |
| --------------------- | ------------- | ----------------------------------- |
| `If-Match`            | `ETag`        | Optimistic concurrency on updates   |
| `If-None-Match`       | `ETag`        | Cache revalidation; conditional GET |
| `If-Modified-Since`   | `Last-Modified` | Cache revalidation                |
| `If-Unmodified-Since` | `Last-Modified` | Guard against lost updates         |

```http
PUT /articles/42 HTTP/1.1
Host: api.example.com
If-Match: "a1b2c3"
Content-Type: application/json

{"title":"Updated title"}
```

If the entity-tag no longer matches, the server responds `412 Precondition Failed`, preventing a client from overwriting changes it has not seen. A conditional GET that still matches yields `304 Not Modified`.

---

## Range requests

Range requests let a client ask for one or more portions of a representation rather than the whole thing, which supports resumable downloads and media seeking. A server that supports ranges advertises `Accept-Ranges: bytes`.

```http
GET /video.mp4 HTTP/1.1
Host: media.example.com
Range: bytes=1024-2047

HTTP/1.1 206 Partial Content
Content-Range: bytes 1024-2047/5000000
Content-Length: 1024
Accept-Ranges: bytes
```

A successful partial response uses `206 Partial Content`. A range that cannot be satisfied yields `416 Range Not Satisfiable`. The `If-Range` header lets a client resume only if the resource has not changed.

---

## Authentication framework

RFC 9110 defines a general, extensible framework for access authentication rather than any single scheme. When a resource requires credentials, the server responds `401 Unauthorized` with a `WWW-Authenticate` header naming one or more challenges, each identifying an authentication scheme and its parameters, including a `realm`.

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api", error="invalid_token"
```

The client retries with an `Authorization` header carrying credentials for a chosen scheme. For access through a proxy, the parallel `407 Proxy Authentication Required`, `Proxy-Authenticate`, and `Proxy-Authorization` fields apply. Specific schemes such as Basic, Digest, and Bearer are defined in their own documents.

---

## Why this specification matters

RFC 9110 is the anchor for the entire HTTP ecosystem. Caching (RFC 9111), and the wire formats HTTP/1.1 (RFC 9112), HTTP/2 (RFC 9113), and HTTP/3 (RFC 9114) all build on the semantics defined here. When two specifications appear to disagree about what a method or header means, RFC 9110 is the authority.
