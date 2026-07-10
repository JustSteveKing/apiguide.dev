---
title: "Not Acceptable"
statusCode: 406
statusText: Not Acceptable
category: client-error
relatedCodes: ['unsupported-media-type', 'unprocessable-query']
publishedDate: 2026-07-09
---

## When to use it

Use 406 Not Acceptable when the client asks, through proactive content negotiation, for a representation the server is unable to produce. The client expresses its preferences with headers like `Accept`, `Accept-Language`, `Accept-Encoding`, or `Accept-Charset`, and when none of the acceptable options overlaps with what the server can generate, 406 signals that no compatible representation exists.

A common example is an API that only serializes JSON receiving `Accept: application/xml`. Because the server has nothing that satisfies the request's stated constraints, it returns 406 rather than sending a JSON body the client explicitly declared it would not accept. In practice many APIs choose to ignore an unsatisfiable `Accept` and return their default representation anyway, so reserve 406 for cases where strict negotiation is a deliberate contract.

## When not to use it

Do not confuse 406 with `unsupported-media-type` (415). The two sit on opposite sides of the exchange: 406 is about the response the client is willing to receive (the `Accept` header), while 415 is about the request body the server is unwilling to consume (the `Content-Type` header). If a client uploads a payload in a format the server cannot parse, that is 415, not 406. Do not use 406 for content that is negotiable but simply invalid — validation and query problems belong to `unprocessable-query` and 422.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/not-acceptable",
  "title": "Not Acceptable",
  "status": 406,
  "detail": "This endpoint can only produce application/json, which does not match the Accept header.",
  "instance": "/v1/reports/quarterly"
}
```

The offending request declares an `Accept` header the server cannot satisfy:

```http
GET /v1/reports/quarterly HTTP/1.1
Host: api.example.com
Accept: application/xml
```

To resolve it, the client should send an `Accept` value the server supports (for example `Accept: application/json`) or omit the header to receive the endpoint's default representation.
