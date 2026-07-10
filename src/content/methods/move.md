---
name: "MOVE"
description: "Moves or renames a resource to the URI given in the Destination header, in WebDAV."
safe: false
idempotent: true
cacheable: false
relatedCodes: [201, 204, 207]
---

## What is the MOVE method?

The `MOVE` method is a WebDAV extension (RFC 4918) used by clients to relocate or rename a resource, moving it to the URI named in the `Destination` header.

## API Usage & Best Practices

* **Set the Destination**: Always supply the `Destination` header naming where the resource should end up.
* **Control overwrites**: Use the `Overwrite` header to allow or forbid replacing an existing resource at the destination.
* **Atomic relocation**: A MOVE removes the source and creates the destination together, which is the standard way to rename a resource.

## Common Response Codes

* **201 Created**: The resource was moved to a previously empty destination.
* **204 No Content**: An existing destination resource was overwritten by the move.
* **207 Multi-Status**: Reports per-member results when moving a collection partially fails.
