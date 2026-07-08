---
name: "ETag"
description: "An identifier for a specific version of a resource, used for cache validation."
category: "response"
standard: true
relatedCodes: [200, 304, 412]
---

## What is the ETag header?

The `ETag` (Entity Tag) response header is a unique string hash representing the current state of a resource. If the resource data changes, the ETag changes.

## API Usage & Best Practices

* **Saves bandwidth**: Clients save the ETag and send it back on subsequent requests in the `If-None-Match` header. If the data is unchanged, the server responds with `304 Not Modified` instead of rebuilding and sending the JSON.
* **Optimistic concurrency**: Can be used alongside `If-Match` to prevent clients from overwriting each other's edits.

## Examples

```http
HTTP/1.1 200 OK
ETag: "w/3a84e27f01"
```
