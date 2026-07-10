---
name: "PROPFIND"
description: "Retrieves properties defined on a resource, and optionally its member resources, in WebDAV."
safe: true
idempotent: true
cacheable: false
relatedCodes: [207, 404]
---

## What is the PROPFIND method?

The `PROPFIND` method is a WebDAV extension (RFC 4918) used by clients to retrieve properties, such as metadata and structure, from a resource and optionally the members of a collection.

## API Usage & Best Practices

* **Control the depth**: Use the `Depth` header to fetch properties for just the resource, its immediate children, or the whole tree.
* **Request specific properties**: Send an XML body naming the properties you want, or ask for all names, to avoid oversized responses.
* **Read-only**: PROPFIND never mutates state, making it safe to retry and cache-neutral.

## Common Response Codes

* **207 Multi-Status**: The standard success response, carrying per-resource property results in an XML body.
* **404 Not Found**: The target resource or collection does not exist.
