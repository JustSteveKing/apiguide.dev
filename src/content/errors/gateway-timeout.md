---
title: Gateway Timeout
statusCode: 504
statusText: Gateway Timeout
category: server-error
relatedCodes: ['service-unavailable', 'internal-server-error']
publishedDate: 2026-07-07
---

## When to use it

Use 504 Gateway Timeout when an upstream server (such as Nginx, Apache, an API Gateway, or Cloudflare) acting as a gateway or proxy fails to receive a timely response from the backend application server (like Node.js, Python, or Go) to complete the request.

This error tells the client that the request reached the edge network or gateway, but the processing server took too long to respond (e.g. database query lock, infinite loop, or external API timeout).

## When not to use it

Do not use 504 if the application server failed or returned a blank response quickly (use 500 Internal Server Error). Do not use this code if the server is down or undergoing maintenance (use 503 Service Unavailable).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/gateway-timeout",
  "title": "Gateway Timeout",
  "status": 504,
  "detail": "The upstream gateway server did not receive a timely response from the application server.",
  "instance": "/v1/leads"
}
```
