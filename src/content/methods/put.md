---
name: "PUT"
description: "Replaces all current representations of the target resource with the request payload."
safe: false
idempotent: true
cacheable: false
relatedCodes: [200, 204, 400, 404, 412, 422]
---

## What is the PUT method?

The `PUT` method replaces the state of the target resource entirely with the payload sent in the request. If the resource does not exist, PUT can create it (though POST is generally preferred for creation).

## API Usage & Best Practices

* **Complete replacement**: The payload must represent the entire resource. If a field is omitted in the request, it should be cleared or set to its default value on the server.
* **Idempotency**: PUT is idempotent. Sending the exact same PUT payload multiple times will result in the same resource state on the server.
* **Conditional updates**: Always use the `If-Match` header containing an ETag during a PUT to ensure a client doesn't overwrite concurrent changes made by another user.

## Common Response Codes

* **200 OK**: The resource was updated and the modified resource is returned.
* **204 No Content**: The resource was successfully updated but no body is returned.
* **412 Precondition Failed**: The `If-Match` ETag check failed, indicating concurrent edits.
