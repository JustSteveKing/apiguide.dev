---
name: "PATCH"
description: "Applies partial modifications to a resource."
safe: false
idempotent: false
cacheable: false
relatedCodes: [200, 204, 400, 404, 412, 422]
---

## What is the PATCH method?

The `PATCH` method applies partial modifications to a resource. Unlike PUT, which replaces the resource, PATCH only modifies specified fields.

## API Usage & Best Practices

* **Partial updates**: The payload only needs to contain the fields being modified (e.g. `{"status": "active"}`). Unspecified fields remain untouched.
* **Non-idempotency warning**: While patch is often used idempotently, it is technically non-idempotent because operations like appending items to an array (e.g., JSON Patch commands) yield different results if executed repeatedly.
* **Validate modifications**: Ensure changes are validated against business rules (e.g. status transition constraints) returning a `422 Unprocessable Entity` on failure.

## Common Response Codes

* **200 OK**: The resource was modified and returned.
* **204 No Content**: The modification succeeded but returns no response body.
* **400 Bad Request**: The patch document itself is structurally malformed (invalid JSON or invalid JSON Patch syntax).
* **404 Not Found**: The target resource doesn't exist.
* **412 Precondition Failed**: An `If-Match` ETag check failed, indicating concurrent edits.
* **422 Unprocessable Entity**: The requested modifications violate business constraints.
