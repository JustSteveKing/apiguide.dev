---
title: Range Not Satisfiable
statusCode: 416
statusText: Range Not Satisfiable
category: client-error
relatedCodes: ['invalid-query-parameter', 'unprocessable-query', 'precondition-failed']
publishedDate: 2026-10-14
updatedDate: 2026-10-14
---

## When to use it

Use 416 Range Not Satisfiable when a client sends a [`Range`](/headers/range) header for part of a representation and none of the ranges it asked for can be served. RFC 9110 defines 416 for a range set rejected "either because none of the requested ranges are satisfiable or because the client has requested an excessive number of small or overlapping ranges (a potential denial of service attack)".

For byte ranges on a `GET`, RFC 9110 says a range is satisfiable if it is an int-range whose first position is less than the current length of the representation, or a suffix range with a non-zero length. So for a 10,000-byte file, `bytes=10000-` and `bytes=20000-29999` cannot be satisfied. `bytes=9500-20000` can: the server cuts the range at the end of the file and serves bytes 9500 to 9999.

The common API case is a resumable download. The client stored 47,022 bytes, the download was in fact complete, and it asks to resume from byte 47,022. Nothing remains to send, so the answer is 416.

RFC 9110 says a server sending 416 for a byte-range request SHOULD include [`Content-Range`](/headers/content-range) with an unsatisfied-range value, `bytes */<length>`, giving the current length of the selected representation. That one header is what lets the client recover: if the length matches what it already holds, the download is done; if not, the file has changed and it should start again.

## When not to use it

Do not use it for a `Range` header your server does not support or cannot parse. RFC 9110 lets a server ignore `Range` entirely, and requires an origin server to ignore one with a range unit it does not understand. Answer with 200 and the full representation. Many servers do this for every range request, which is why RFC 9110 warns that clients "cannot depend on receiving a 416".

Do not use it for a `Range` header on a method other than `GET`. RFC 9110 says a server MUST ignore a `Range` header on a method for which range handling is not defined, and `GET` is the only one it defines.

Do not use it for page-based or cursor pagination that goes past the end of a collection. That is not an HTTP range request: return an empty page, or use `unprocessable-query` or `invalid-query-parameter` if your API treats it as an error.

Do not use it when the client's [`If-Range`](/headers/if-range) validator no longer matches. RFC 9110 handles that case by sending the full representation with 200, not an error. And if the client sent `If-Match` and the representation changed, that is `precondition-failed` (412).

## Example response

```http
HTTP/1.1 416 Range Not Satisfiable
Content-Range: bytes */47022
Content-Type: application/problem+json
```

```json
{
  "type": "https://apiguide.dev/errors/range-not-satisfiable",
  "title": "Range Not Satisfiable",
  "status": 416,
  "detail": "The requested range starts at byte 47022, but the file is 47022 bytes long.",
  "instance": "/v1/exports/exp_3391/file"
}
```

The request that triggers it asks to resume from the first byte past the end of the file:

```http
GET /v1/exports/exp_3391/file HTTP/1.1
Host: api.example.com
Range: bytes=47022-
```

The `Content-Range` header carries the information a client acts on, so send it even if you keep the body minimal. The body is optional; the header is not something you should leave out.
