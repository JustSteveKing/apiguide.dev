---
name: "If-Match"
description: "Makes the request conditional; execution occurs only if the client ETag matches the server ETag."
category: "request"
standard: true
relatedCodes: [412, 428]
---

## What is the If-Match header?

The `If-Match` request header makes the request conditional. The server will perform the requested mutation (PUT, PATCH, DELETE) only if the provided ETag matches the current ETag of the resource on the server.

## API Usage & Best Practices

* **Prevents lost updates**: Forces clients to check if the resource has been modified since they last read it.
* **Handle failures**: If the ETags do not match, abort the update and return a `412 Precondition Failed`.

## Examples

```http
PATCH /v1/leads/lead_123 HTTP/1.1
If-Match: "w/3a84e27f01"
```
