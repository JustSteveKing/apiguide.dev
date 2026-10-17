---
title: Maintenance Mode
statusCode: 503
statusText: Service Unavailable
category: server-error
relatedCodes: ['service-unavailable', 'feature-disabled', 'gateway-timeout']
publishedDate: 2026-10-17
---

## When to use it

Use [`503 Service Unavailable`](/status-codes/503) with a Maintenance Mode error when you have taken the API, or part of it, out of service on purpose for planned work: a database migration, a data center move, a version upgrade that needs writes stopped. RFC 9110 names scheduled maintenance as one of the two reasons for 503, alongside temporary overload.

This is more specific than `service-unavailable`, which covers any temporary inability to serve, including an overload you did not plan. Planned maintenance has a known end, and that is what makes it worth its own type: the client can schedule its retry for the end of the window, show users an honest message, and pause background jobs, rather than backing off blindly.

Always send [`Retry-After`](/headers/retry-after). RFC 9110 makes it optional on a 503, but for planned work you know the answer, and an HTTP-date set to the end of the window is the most useful value you can give. Repeat the window in the body so it reaches clients that do not read headers.

A partial maintenance mode works the same way. If the API stays readable while writes are paused, answer the reads normally and the writes with this type. Say which operations are affected, so the client does not conclude the whole API is down.

## When not to use it

Do not use it for unplanned outages or overload. You do not know when those end, and claiming a maintenance window you never scheduled misleads clients into retrying at the wrong time. That is `service-unavailable`.

Do not use it for a feature that is switched off for one account or plan. That is `feature-disabled` (403), and it is not going to resolve on its own at the end of a window.

Do not use it when your server is up and an upstream it depends on is down for its own maintenance. If you are acting as a gateway, that is `bad-gateway` (502) or `gateway-timeout` (504). If your API is the product and the upstream is an implementation detail, use `service-unavailable` and do not blame the third party in the response.

Do not let a [health check](/guides/health-checks) endpoint return this type to your own load balancer during maintenance unless you mean for the instance to be pulled from rotation. Decide which endpoints stay up and say so in your runbook.

## Example response

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/problem+json
Retry-After: Sat, 17 Oct 2026 06:00:00 GMT

{
  "type": "https://apiguide.dev/errors/maintenance-mode",
  "title": "Maintenance Mode",
  "status": 503,
  "detail": "Writes are paused for scheduled database maintenance until 06:00 UTC. Reads are unaffected.",
  "instance": "/v1/orders",
  "maintenanceStartedAt": "2026-10-17T04:00:00Z",
  "maintenanceEndsAt": "2026-10-17T06:00:00Z",
  "statusPage": "https://status.example.com/incidents/2026-10-17-db"
}
```

Announce the window before it starts, on a status page and through whatever channel your integrators read. A maintenance window clients only learn about from a 503 is an outage with better paperwork.
