---
title: Request Header Fields Too Large
statusCode: 431
statusText: Request Header Fields Too Large
category: client-error
relatedCodes: ['uri-too-long', 'payload-too-large', 'unauthorized']
publishedDate: 2026-10-14
updatedDate: 2026-10-14
---

## When to use it

Use 431 Request Header Fields Too Large, defined in RFC 6585, when the server will not process the request because its header fields are too large. RFC 6585 says it applies both "when the set of request header fields in total is too large, and when a single header field is at fault", and that the request "MAY be resubmitted after reducing the size of the request header fields".

RFC 9110 makes rejection mandatory: a server that receives a header field line, field value or set of fields "larger than it wishes to process MUST respond with an appropriate 4xx (Client Error) status code". Silently ignoring an oversized field is not an option, because RFC 9110 notes that doing so increases exposure to request smuggling. 431 is the specific code for that 4xx.

In APIs the usual causes are an [`Authorization`](/headers/authorization) header carrying a JWT stuffed with claims, such as every group or permission a user has, and a [`Cookie`](/headers/cookie) header that has grown as more cookies were set on the domain. Both grow over time with no change in client code, so a request that worked last month starts failing.

When a single field is at fault, RFC 6585 says the response SHOULD name it. Do that: "header too large" with no field name sends the client hunting through every header it sends.

## When not to use it

Do not use it when the request line is too long because of a long path or query string. That is `uri-too-long` (414). Do not use it for an oversized request body; that is `payload-too-large` (413).

Do not use it when the token in `Authorization` is within size limits but invalid, expired or unrecognized. That is `unauthorized` (401). Size is checked before the token is even parsed, and the client's fix is different: a smaller token, not a new one.

Expect to receive other codes for this condition from intermediaries. nginx, for example, returns 400 Bad Request when a single header field exceeds one `large_client_header_buffers` buffer, 8K by default. If you control the edge, configure it to return 431 with a problem body so clients get a consistent answer.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/request-header-fields-too-large",
  "title": "Request Header Fields Too Large",
  "status": 431,
  "detail": "The Authorization header is 12288 bytes. Individual header fields are limited to 8192 bytes.",
  "instance": "/v1/leads",
  "field": "Authorization",
  "maxFieldSize": 8192
}
```

RFC 6585 says a 431 response MUST NOT be stored by a cache.

The lasting fix is usually on the issuing side, not the client. Keep access tokens small by referencing permissions rather than embedding them, and keep cookies scoped to the paths and domains that need them. Raising the server's header limit only postpones the next failure, and every proxy in the path has its own limit too.
