---
title: Method Not Allowed
statusCode: 405
statusText: Method Not Allowed
category: client-error
relatedCodes: ['resource-not-found']
publishedDate: 2026-07-07
---

## When to use it

Use 405 Method Not Allowed when the HTTP request URI matches a valid path in your routing table, but the specific HTTP method used (e.g. `POST`, `PUT`, `DELETE`) is not supported by that endpoint.

HTTP specifications require that a 405 response must include an `Allow` header listing the valid HTTP methods for the requested resource (e.g. `Allow: GET, HEAD`).

## When not to use it

Do not use 405 if the URI itself does not exist in the routing table (use `resource-not-found` / 404 instead).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/method-not-allowed",
  "title": "Method Not Allowed",
  "status": 405,
  "detail": "The POST method is not supported for this endpoint. Supported methods: GET, HEAD.",
  "instance": "/v1/leads"
}
```

Together with the response, send the `Allow` header:

```
Allow: GET, HEAD
```
