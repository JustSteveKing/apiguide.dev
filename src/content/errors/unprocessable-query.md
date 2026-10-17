---
title: Unprocessable Query
statusCode: 422
statusText: Unprocessable Content
category: client-error
relatedCodes: ['invalid-pagination-cursor', 'invalid-query-parameter']
publishedDate: 2026-03-16
updatedDate: 2026-10-14
---

## When to use it

Use 422 when the request is syntactically valid but semantically wrong. The client sent well formed JSON or query parameters, the shape matches what you expect, but the values don't make sense together.

A pagination request asking for `page=2` on a collection with one page of results is a 422. The request is valid on its face. The server understood it fine. It just can't be fulfilled because the state of the data doesn't support it.

## When not to use it

400 is for requests the server cannot parse. Malformed JSON in the body is `malformed-request-body`. A query parameter the endpoint never accepts, such as an unsupported `sort` field, is `invalid-query-parameter`.

Do not use this type for a request body that parses but fails validation, such as a missing required field, a string where an integer belongs, or an invalid email address. RFC 9110 defines 422 for content whose type and syntax the server understands but whose instructions it cannot process, so those are 422 too, but they belong to `validation-failed`, which carries per-field errors. Use this type when the problem is the query: values that are individually valid but cannot be satisfied together or against the current data.

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
