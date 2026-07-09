---
title: Internal Server Error
statusCode: 500
statusText: Internal Server Error
category: server-error
relatedCodes: ['service-unavailable', 'gateway-timeout']
publishedDate: 2025-11-10
---

## When to use it

Use 500 Internal Server Error when the application encounters an unexpected, unhandled exception or system failure that prevents it from fulfilling the request. This code indicates a bug, database failure, or structural breakdown within the server code.

In production environments, always sanitize this response to prevent leaking internal stack traces, class names, or environment variables to the outside world.

## When not to use it

Do not use 500 for validation errors, permission failures, or normal domain logic branches (e.g. record not found). In those cases, use the appropriate 4xx code. Do not use 500 if you know the server is overloaded or down for maintenance (use 503 Service Unavailable).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred while processing the request.",
  "instance": "/v1/leads"
}
```
