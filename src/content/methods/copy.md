---
name: "COPY"
description: "Copies a resource from its current location to the URI given in the Destination header, in WebDAV."
safe: false
idempotent: true
cacheable: false
relatedCodes: [201, 204, 207]
---

## What is the COPY method?

The `COPY` method is a WebDAV extension (RFC 4918) used by clients to duplicate a resource, placing a copy at the URI named in the `Destination` header.

## API Usage & Best Practices

* **Set the Destination**: Always supply the `Destination` header naming the target URI for the copy.
* **Control overwrites**: Use the `Overwrite` header to decide whether an existing resource at the destination may be replaced.
* **Mind the depth**: For collections, the `Depth` header determines whether only the collection or its full tree is copied.

## Common Response Codes

* **201 Created**: The copy was created at a previously empty destination.
* **204 No Content**: An existing destination resource was overwritten by the copy.
* **207 Multi-Status**: Reports per-member results when copying a collection partially fails.
