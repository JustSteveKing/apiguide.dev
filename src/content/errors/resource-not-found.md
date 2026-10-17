---
title: Resource Not Found
statusCode: 404
statusText: Not Found
category: client-error
relatedCodes: ['method-not-allowed', 'gone', 'forbidden']
publishedDate: 2025-11-03
updatedDate: 2026-10-14
---

## When to use it

Use 404 Resource Not Found when the requested URI does not match any route in the application routing table, or when a dynamic segment of the URI (such as an ID or UUID) refers to a resource database record that does not exist or has been deleted.

A 404 is the definitive way to tell a client that the resource they are asking for does not exist.

## When not to use it

Do not use 404 when the caller is not authenticated (use `unauthorized` / 401), or when the caller can see the resource but is not permitted to perform the action (use `forbidden` / 403). RFC 9110 does allow 404 in place of 403 when the caller should not learn that the resource exists at all, such as another tenant's records. If the resource was removed on purpose and you know it will not return, such as a sunset endpoint, use `gone` (410).

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
