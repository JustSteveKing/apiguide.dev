---
title: Unprocessable Query
statusCode: 422
statusText: Unprocessable Entity
category: client-error
relatedCodes: ['invalid-pagination-cursor']
publishedDate: 2026-07-07
---

## When to use it

Use 422 when the request is syntactically valid but semantically wrong. The client sent well formed JSON or query parameters, the shape matches what you expect, but the values don't make sense together.

A pagination request asking for `page=2` on a collection with one page of results is a 422. The request is valid on its face. The server understood it fine. It just can't be fulfilled because the state of the data doesn't support it.

## When not to use it

400 is for requests the server can't even parse or validate structurally. Missing a required field, sending a string where you need an integer, malformed JSON. If validation fails before you've touched business logic, that's 400.

A common mistake is reaching for 422 on every validation failure, including basic type errors. If a `Form Request` rejects the payload because `email` isn't a valid email address, that's a 400 level problem, not a 422 one. Save 422 for cases where the values are individually valid but jointly impossible.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/unprocessable-query",
  "title": "Unprocessable Query",
  "status": 422,
  "detail": "Requested page 2 exceeds the available range of 1 page.",
  "instance": "/v1/leads?page=2"
}
```
