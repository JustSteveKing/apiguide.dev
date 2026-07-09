---
name: "DELETE"
description: "Deletes the specified resource."
safe: false
idempotent: true
cacheable: false
relatedCodes: [200, 202, 204, 404, 409, 410]
---

## What is the DELETE method?

The `DELETE` method requests that the server delete the resource identified by the URI.

## API Usage & Best Practices

* **Idempotent**: Once a resource is deleted, calling DELETE again should have no further effect on the server state. The first call returns 204; subsequent calls can return 204 or 404 (the server state remains deleted).
* **Cascading deletes**: Document whether deleting a resource will also delete its children (cascade) or fail due to active references (returning a `409 Conflict`).
* **Soft Deletes**: If resources are "soft-deleted" (marked as hidden but preserved in the database), the endpoint should still return a `204 No Content` or `410 Gone` to the client.

## Common Response Codes

* **200 OK**: The deletion succeeded and the response body contains the deleted representation (less common than 204).
* **202 Accepted**: The deletion request was queued for async processing (common for large datasets).
* **204 No Content**: The deletion succeeded and the response body is empty.
* **404 Not Found**: The resource doesn't exist (already deleted, or never did).
* **409 Conflict**: The deletion was blocked because of active foreign-key dependencies.
* **410 Gone**: The resource was soft-deleted and the server chooses to say so explicitly rather than returning 204/404.
