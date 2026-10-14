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
* **Strong vs weak**: A weak tag is written `W/"..."`, with the `W/` prefix outside the quotes, and claims only semantic equivalence. `If-Match` uses strong comparison, so a weak tag never matches there: if clients will send the tag back on writes, issue strong tags. Weak tags are fine for `If-None-Match` cache validation.

## Examples

```http
HTTP/1.1 200 OK
ETag: "3a84e27f01"
```

A weak tag, for a representation that is equivalent but not byte-for-byte identical:

```http
HTTP/1.1 200 OK
ETag: W/"3a84e27f01"
```
