---
title: Unsupported Media Type
statusCode: 415
statusText: Unsupported Media Type
category: client-error
relatedCodes: ['malformed-request-body', 'payload-too-large']
publishedDate: 2026-04-28
---

## When to use it

Use 415 Unsupported Media Type when the server rejects a request because the request's payload format is not supported. This is typically driven by the `Content-Type` header of the request (for example, a client sending XML `application/xml` or form data `application/x-www-form-urlencoded` to an API endpoint that only accepts JSON `application/json`).

It can also apply to binary uploads, such as uploading a `.gif` file to a profile picture endpoint that only accepts `.jpg` or `.png`.

## When not to use it

Do not use 415 if the `Content-Type` header is correct, but the contents inside the payload fail to parse. For example, if the content is marked as `application/json` but has a syntax error, use `malformed-request-body` (400).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/unsupported-media-type",
  "title": "Unsupported Media Type",
  "status": 415,
  "detail": "The Content-Type 'application/xml' is not supported. Supported content types: application/json.",
  "instance": "/v1/leads"
}
```
