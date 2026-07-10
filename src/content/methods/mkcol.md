---
name: "MKCOL"
description: "Creates a new collection resource at the specified location in WebDAV."
safe: false
idempotent: true
cacheable: false
relatedCodes: [201, 405, 409]
---

## What is the MKCOL method?

The `MKCOL` method is a WebDAV extension (RFC 4918) used by clients to create a new collection, the WebDAV equivalent of a directory, at the request URL.

## API Usage & Best Practices

* **Target must be empty**: MKCOL fails if a resource already exists at the location, so the request URL should be unused.
* **Parents must exist**: The intermediate collections in the path must already be present, otherwise the server reports a conflict.
* **Idempotent creation**: Creating the same collection produces the same end state, though a second call on an existing collection returns 405.

## Common Response Codes

* **201 Created**: The collection was created successfully.
* **405 Method Not Allowed**: A resource already exists at the target URL.
* **409 Conflict**: A parent collection in the path does not exist.
