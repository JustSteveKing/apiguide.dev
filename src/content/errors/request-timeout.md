---
title: "Request Timeout"
statusCode: 408
statusText: Request Timeout
category: client-error
relatedCodes: ['service-unavailable', 'gateway-timeout']
publishedDate: 2026-07-09
---

## When to use it

Use 408 Request Timeout when the server was prepared to receive a request but the client did not produce a complete one within the time the server was willing to wait. This is about the inbound half of the exchange: the connection opened, but the request line, headers, or body arrived too slowly — or never finished arriving — so the server gave up waiting and closed the idle connection.

Typical triggers are a client that opens a socket and stalls before sending anything, a slow or interrupted upload that never reaches the declared `Content-Length`, or a keep-alive connection held open long past the server's idle threshold. Because the fault lies with the client's transmission rather than any server-side processing, 408 sits in the 4xx client-error range.

## When not to use it

Do not use 408 for timeouts that happen while the server or an upstream dependency is doing work. If the request was fully received and a downstream service was too slow to answer, that is `gateway-timeout` (504); if the server itself is temporarily overloaded or down, use `service-unavailable` (503). The distinction is directional: 408 means the client was too slow to send, while 504 means an upstream was too slow to respond. Do not use 408 as a generic retry signal for backend latency.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/request-timeout",
  "title": "Request Timeout",
  "status": 408,
  "detail": "The server timed out waiting for the request to be completed.",
  "instance": "/v1/uploads"
}
```

A server issuing 408 will normally signal that the connection is being torn down, since the incomplete request cannot be resumed:

```http
HTTP/1.1 408 Request Timeout
Connection: close
Content-Type: application/problem+json
```

The `Connection: close` header tells the client not to reuse the socket. A client that sees 408 is free to open a fresh connection and send the request again, ideally after checking for slow uploads or an unstable network on its side.
