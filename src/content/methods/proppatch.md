---
name: "PROPPATCH"
description: "Sets or removes properties on a resource atomically in WebDAV."
safe: false
idempotent: true
cacheable: false
relatedCodes: [207, 409]
---

## What is the PROPPATCH method?

The `PROPPATCH` method is a WebDAV extension (RFC 4918) used by clients to set and remove properties on a resource, with all changes in a single request applied atomically.

## API Usage & Best Practices

* **All or nothing**: Every set and remove instruction in one PROPPATCH succeeds together or fails together, keeping the resource consistent.
* **Order your instructions**: The server processes the XML instructions in document order, so structure them deliberately.
* **Idempotent updates**: Reapplying the same PROPPATCH yields the same final property state, making retries safe.

## Common Response Codes

* **207 Multi-Status**: The standard success response, reporting the outcome of each property change.
* **409 Conflict**: A property could not be set, for example because the parent resource is in an incompatible state.
