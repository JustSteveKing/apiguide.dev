---
name: "LOCK"
description: "Takes out a lock on a resource to prevent conflicting changes, in WebDAV."
safe: false
idempotent: false
cacheable: false
relatedCodes: [200, 423]
---

## What is the LOCK method?

The `LOCK` method is a WebDAV extension (RFC 4918) used by clients to place a lock on a resource, granting the holder a lock token that guards against overwrites while editing.

## API Usage & Best Practices

* **Capture the lock token**: A successful LOCK returns a lock token that you must supply on later writes to prove ownership.
* **Refresh before expiry**: Locks have a timeout, so reissue the LOCK to extend it if you need more time.
* **Not idempotent**: Repeating a LOCK can create a new lock or refresh an existing one, so the outcome differs between calls.

## Common Response Codes

* **200 OK**: The lock was granted and the response includes the lock token.
* **423 Locked**: The resource is already locked by someone else and cannot be locked again.
