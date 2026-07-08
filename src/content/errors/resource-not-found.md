---
title: Resource Not Found
statusCode: 404
statusText: Not Found
category: client-error
relatedCodes: ['method-not-allowed']
publishedDate: 2026-07-07
---

## When to use it

Use 404 Resource Not Found when the requested URI does not match any route in the application routing table, or when a dynamic segment of the URI (such as an ID or UUID) refers to a resource database record that does not exist or has been permanently deleted.

A 404 is the definitive way to tell a client that the resource they are asking for does not exist.

## When not to use it

Do not use 404 if the resource exists but is currently unavailable due to permissions or authorization issues. In those cases, use `unauthorized` (401) or `insufficient-scope` (403) to avoid leaking the existence of sensitive resources.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "No lead record found with ID 'lead_12345'.",
  "instance": "/v1/leads/lead_12345"
}
```
