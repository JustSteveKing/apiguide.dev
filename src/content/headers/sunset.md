---
name: "Sunset"
description: "The date after which a resource is expected to become unavailable."
category: "response"
standard: true
relatedCodes: []
---

## What is the Sunset header?

The `Sunset` response header, defined in RFC 8594, carries an HTTP-date indicating the point in time after which the resource is likely to become unresponsive or be removed. It lets API providers communicate a hard end-of-life to their consumers.

## API Usage & Best Practices

* **Set a clear deadline**: Use the date to tell integrators exactly how long they have before the endpoint stops working, so migrations can be planned.
* **Pair with Deprecation**: `Sunset` states when a resource disappears, while the `Deprecation` header signals that it is already discouraged; using both together gives the full timeline.

## Examples

```http
HTTP/1.1 200 OK
Sunset: Sat, 31 Oct 2026 23:59:59 GMT
Link: <https://api.example.com/docs/migration>; rel="sunset"
```
