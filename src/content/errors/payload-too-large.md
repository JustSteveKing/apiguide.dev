---
title: Payload Too Large
statusCode: 413
statusText: Payload Too Large
category: client-error
relatedCodes: ['malformed-request-body', 'unsupported-media-type']
publishedDate: 2026-07-07
---

## When to use it

Use 413 Payload Too Large when the client sends a request body (often a file upload or bulk records batch) that exceeds the maximum size limit configured on the server or application.

This informs the client that their request was rejected solely because of its size, and that they should slice the request into smaller chunks or compress the payload.

## When not to use it

Do not use 413 if the payload size is within bounds, but contains too many database records or relations that violate business constraints. In those cases, use `validation-failed` or `unprocessable-query`.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/payload-too-large",
  "title": "Payload Too Large",
  "status": 413,
  "detail": "The request body size of 24.5 MB exceeds the limit of 10 MB.",
  "instance": "/v1/documents/upload"
}
```
