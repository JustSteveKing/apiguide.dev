---
name: "POST"
description: "Submits an entity to the specified resource, often causing a change in state or side effects on the server."
safe: false
idempotent: false
cacheable: false
relatedCodes: [200, 201, 202, 400, 409, 422]
---

## What is the POST method?

The `POST` method submits data to the server to create a new resource, execute a controller action, or trigger side effects.

## API Usage & Best Practices

* **Non-idempotent**: Multiple identical POST requests will result in multiple resource creations or side effects. If a client submits a payment request twice, they may be charged twice.
* **Protect with Idempotency Keys**: Use a custom header like `Idempotency-Key` to prevent duplicate creations due to network timeouts.
* **Redirect on Success**: Standard practice for resource creation is to return a `201 Created` response containing a `Location` header pointing to the new resource.

## Common Response Codes

* **200 OK**: The request succeeded but the endpoint doesn't create a resource (e.g. a search or action controller returning a result body).
* **201 Created**: The resource was successfully created.
* **202 Accepted**: The request was accepted and queued for async background processing.
* **400 Bad Request**: The request body is structurally malformed (invalid JSON).
* **409 Conflict**: The resource being created collides with an existing one (e.g. a unique constraint violation).
* **422 Unprocessable Entity**: The request body was parsed but failed input validation.
