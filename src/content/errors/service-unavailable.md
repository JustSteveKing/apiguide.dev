---
title: Service Unavailable
statusCode: 503
statusText: Service Unavailable
category: server-error
relatedCodes: ['internal-server-error', 'gateway-timeout']
publishedDate: 2026-01-13
---

## When to use it

Use 503 Service Unavailable when the server is temporarily unable to process the request because it is overloaded or down for planned maintenance. 

Along with the 503 status, you should ideally include a `Retry-After` HTTP header indicating how long the client should wait before making another request (either in seconds, or as an HTTP-date timestamp).

## When not to use it

Do not use 503 if the server encountered a code bug or unhandled database issue (use 500 Internal Server Error instead). Do not use this if an individual client is being rate-limited (use 429 Rate Limit Exceeded).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/service-unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "The database is undergoing scheduled maintenance. Please try again later.",
  "instance": "/v1/leads"
}
```

Include a header to notify the client when the service will be restored:

```
Retry-After: 300
```
