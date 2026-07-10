---
name: "UNLOCK"
description: "Removes a lock from a resource using the supplied lock token, in WebDAV."
safe: false
idempotent: true
cacheable: false
relatedCodes: [204, 409]
---

## What is the UNLOCK method?

The `UNLOCK` method is a WebDAV extension (RFC 4918) used by clients to release a lock previously taken on a resource, identified by its lock token.

## API Usage & Best Practices

* **Provide the Lock-Token**: Supply the `Lock-Token` header naming the exact lock to remove, or the server cannot honour the request.
* **Release when done**: Always unlock as soon as editing finishes so other clients are not blocked longer than necessary.
* **Idempotent removal**: Once a lock is gone the resource is simply unlocked, so repeating UNLOCK leaves the same end state.

## Common Response Codes

* **204 No Content**: The lock was removed successfully.
* **409 Conflict**: The supplied lock token does not match a lock on the resource.
