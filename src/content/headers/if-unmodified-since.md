---
name: "If-Unmodified-Since"
description: "Makes a request conditional on the resource not having been modified after the given date."
category: "request"
standard: true
relatedCodes: [412, 428]
---

## What is the If-Unmodified-Since header?

The `If-Unmodified-Since` request header, defined in RFC 9110 Section 13.1.4, makes a request conditional on the selected representation's last modification date being earlier than or equal to the date the client sends. It is the date-based counterpart of [`If-Match`](/headers/if-match): the client echoes back the [`Last-Modified`](/headers/last-modified) value it last saw, and the server refuses to apply the change if the resource has moved on since.

## API Usage & Best Practices

* **Prevent lost updates without ETags**: Send it on [`PUT`](/methods/put), [`PATCH`](/methods/patch) and [`DELETE`](/methods/delete) when the resource exposes `Last-Modified` but no [`ETag`](/headers/etag). If the condition is false, the server must not perform the method and typically answers [`412 Precondition Failed`](/status-codes/412).
* **Prefer If-Match when you can**: A recipient must ignore `If-Unmodified-Since` when the request also carries `If-Match`. HTTP dates have one-second resolution, so two writes inside the same second are indistinguishable by date; an entity tag has no such blind spot. If you control the API, emit ETags and use `If-Unmodified-Since` only as a fallback.
* **Send the server's own value back verbatim**: The timestamp is interpreted against the origin server's clock, so copy `Last-Modified` from the earlier response rather than generating a date from the client's clock.
* **Invalid dates are ignored, not rejected**: The server must ignore the header if the value is not a valid HTTP-date or if the resource has no modification date. That silently turns a conditional write into an unconditional one. If your API requires conditional writes, enforce it explicitly and return [`428 Precondition Required`](/status-codes/428) when no usable precondition is present.
* **Not for refreshing a partial download**: On a range request, use [`If-Range`](/headers/if-range) if you want the full new representation when the resource has changed, instead of a `412`.

## Examples

A client updates a document using the `Last-Modified` value from its earlier `GET`:

```http
PUT /v1/documents/doc_42 HTTP/1.1
Host: api.example.com
Content-Type: application/json
If-Unmodified-Since: Tue, 07 Jul 2026 10:00:00 GMT

{"title": "Q3 plan", "status": "draft"}
```

Someone else changed the document after that time, so the write is refused:

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json
Last-Modified: Tue, 07 Jul 2026 10:04:12 GMT
```
