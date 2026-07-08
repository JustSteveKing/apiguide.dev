---
title: Rate Limit Exceeded
statusCode: 429
statusText: Too Many Requests
category: client-error
relatedCodes: ['service-unavailable']
publishedDate: 2026-07-07
---

## When to use it

Use 429 when the client has sent more requests than your rate limiting policy allows within a given window. The request itself is fine. The client just needs to slow down.

This is one of the few error codes where the response body matters less than the headers. A well formed 429 tells the client exactly when it's safe to retry, via `Retry-After` or `X-RateLimit-Reset`, rather than leaving them to guess and hammer the endpoint again immediately.

## When not to use it

503 is for the server being overwhelmed or unavailable at a system level, not for a specific client exceeding their own quota. If your database connection pool is exhausted and every request is failing regardless of who sent it, that's 503. If one client is sending ten times their allotted requests per minute while everyone else is fine, that's 429.

A common mistake is returning 429 for global outages just because it feels close enough. Keep it scoped to per client, per key, or per IP limits, not general capacity problems.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Rate limit of 100 requests per minute exceeded for this API key.",
  "instance": "/v1/leads"
}
```

Pair this with real headers on the response, not just the body:

```
Retry-After: 42
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1720440000
```
