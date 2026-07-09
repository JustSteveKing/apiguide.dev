---
title: Invalid Pagination Cursor
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['unprocessable-query']
publishedDate: 2026-04-14
---

## When to use it

Use 400 when the client sent a value that fails structural validation before any business logic runs. A cursor parameter that isn't valid base64, or that decodes to something other than the expected shape, belongs here.

The key test: has the server been able to understand what the client is asking for at all? If not, it's 400.

## When not to use it

If the cursor decodes fine and points to a real position, but that position is no longer valid because the underlying dataset changed, that's closer to 422 or even 410 depending on your API's semantics. Don't use 400 for a request the server understood but can't fulfil.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/invalid-pagination-cursor",
  "title": "Invalid Pagination Cursor",
  "status": 400,
  "detail": "The cursor parameter could not be decoded.",
  "instance": "/v1/leads?cursor=not-valid-base64"
}
```
