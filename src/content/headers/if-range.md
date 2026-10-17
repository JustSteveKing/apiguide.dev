---
name: "If-Range"
description: "Makes a range request conditional: send the requested part if the resource is unchanged, otherwise send the whole new representation."
category: "request"
standard: true
relatedCodes: [206, 200]
reference:
  title: "RFC 9110, Section 13.1.5"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5
updatedDate: 2026-10-14
---

## What is the If-Range header?

The `If-Range` request header, defined in RFC 9110 Section 13.1.5, makes a [`Range`](/headers/range) request conditional. Its meaning is: if the representation still matches this validator, send me the ranges I asked for; otherwise ignore the `Range` header and send me the entire current representation. The value is either an entity tag or an HTTP-date.

## API Usage & Best Practices

* **Resume downloads safely**: When a client resumes an interrupted download, it sends the [`ETag`](/headers/etag) it received with the first part. If the resource is unchanged, the server returns [`206 Partial Content`](/status-codes/206) with the missing bytes. If it has changed, the server returns [`200 OK`](/status-codes/200) with the full new body, so the client never stitches together bytes from two different versions.
* **One round trip instead of two**: Using [`If-Match`](/headers/if-match) or [`If-Unmodified-Since`](/headers/if-unmodified-since) with `Range` would get a [`412 Precondition Failed`](/status-codes/412) on a change and force a second request. `If-Range` is the only conditional that falls back to the full representation instead of failing.
* **Strong validators only**: A client must not send a weak entity tag (`W/"..."`) in `If-Range`, and the server compares entity tags with the strong comparison function. Send a date only when you have no entity tag and the date is a strong validator in the sense of RFC 9110 Section 8.8.2.2. Date comparison is an exact match against [`Last-Modified`](/headers/last-modified), not the "earlier than or equal to" rule used by `If-Unmodified-Since`.
* **Only meaningful with Range**: A client must not send `If-Range` without `Range`, and a server must ignore it in that case, or when the resource does not support range requests (advertise support with [`Accept-Ranges`](/headers/accept-ranges)).
* **Server side**: If your API serves large exports or files, emit strong ETags on them. Without a strong validator, clients cannot resume reliably and fall back to re-downloading everything.

## Examples

The client already holds the first 1 MiB of an export and asks for the rest, but only if it is the same export:

```http
GET /v1/exports/exp_9f2/download HTTP/1.1
Host: api.example.com
Range: bytes=1048576-
If-Range: "a7c3e9b2"
```

Unchanged, so the server sends the remaining bytes:

```http
HTTP/1.1 206 Partial Content
ETag: "a7c3e9b2"
Content-Range: bytes 1048576-4194303/4194304
Content-Length: 3145728
```

Had the export been regenerated, the server would ignore `Range` and answer `200 OK` with the full new file and its new `ETag`.
