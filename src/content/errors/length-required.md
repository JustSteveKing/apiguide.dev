---
title: Length Required
statusCode: 411
statusText: Length Required
category: client-error
relatedCodes: ['payload-too-large', 'request-timeout', 'uri-too-long']
publishedDate: 2026-10-14
updatedDate: 2026-10-14
---

## When to use it

Use 411 Length Required when the server refuses a request with content that does not declare its size in [`Content-Length`](/headers/content-length). RFC 9110 defines it as a server that "refuses to accept the request without a defined Content-Length", and says the client "MAY repeat the request if it adds a valid Content-Length header field".

In HTTP/1.1, content without `Content-Length` arrives with [`Transfer-Encoding: chunked`](/headers/transfer-encoding), so the server does not learn the size until the last chunk. RFC 9112 says a server MAY reject such a request with 411. The legitimate reason is that you need the size before reading the body: to reject an oversized upload immediately, or because a downstream component requires the length in advance. RFC 9112 describes exactly that case, services that answer chunked requests with 411 because they sit behind a gateway that needs the length and are "unable or unwilling to buffer the entire request".

Name the header in the response, and say whether your endpoint accepts chunked uploads at all, so the client knows to set `Content-Length` and not try a different encoding.

## When not to use it

Do not require `Content-Length` unless you need it. RFC 9112 tells clients to prefer `Content-Length` over chunked when the length is known in advance, but streaming clients often cannot know it, and a server that buffers or enforces a running byte limit can accept chunked bodies safely. Requiring the length shuts out streaming uploads for no gain.

Do not use it when `Content-Length` is present and the body is larger than you allow. That is `payload-too-large` (413), and with `Content-Length` present you can return it before reading the body.

Do not use it when `Content-Length` is present but invalid, such as a non-numeric value or conflicting values. RFC 9112 treats that as broken message framing: the server MUST respond with 400 and close the connection. That is a plain 400 from the HTTP server itself, and your application will usually never see the request.

Do not use it when the client declared a length and then stopped sending before it arrived. That is `request-timeout` (408).

Do not use it for requests with no content. RFC 9110 says a user agent SHOULD NOT send `Content-Length` on a request with no content when the method does not expect any, so a `GET` without it is correct, not a 411.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/length-required",
  "title": "Length Required",
  "status": 411,
  "detail": "Uploads to this endpoint must include a Content-Length header. Chunked transfer encoding is not accepted.",
  "instance": "/v1/documents/upload"
}
```

The request that triggers it streams its body without declaring a length:

```http
POST /v1/documents/upload HTTP/1.1
Host: api.example.com
Content-Type: application/pdf
Transfer-Encoding: chunked
```

To recover, the client should determine the size of the content, send it in `Content-Length`, drop `Transfer-Encoding`, and repeat the request. In HTTP/2 and HTTP/3, chunked transfer coding does not exist and the frames delimit the content, but `Content-Length` is still optional, so a server that requires it can return 411 there too.
