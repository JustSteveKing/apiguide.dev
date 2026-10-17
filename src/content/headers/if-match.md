---
name: "If-Match"
description: "Makes the request conditional; execution occurs only if the client ETag matches the server ETag."
category: "request"
standard: true
relatedCodes: [412, 428]
reference:
  title: "RFC 9110, Section 13.1.1"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1
updatedDate: 2026-10-14
---

## What is the If-Match header?

The `If-Match` request header makes the request conditional. The server will perform the requested mutation (PUT, PATCH, DELETE) only if the provided ETag matches the current ETag of the resource on the server.

## API Usage & Best Practices

* **Prevents lost updates**: Forces clients to check if the resource has been modified since they last read it.
* **Handle failures**: If the ETags do not match, abort the update and return a `412 Precondition Failed`.
* **Strong comparison only**: RFC 9110 requires the origin to compare `If-Match` values with the strong comparison function, so a weak tag such as `W/"3a84e27f01"` never matches. Use strong ETags on any resource that accepts conditional writes.

## Examples

```http
PATCH /v1/leads/lead_123 HTTP/1.1
If-Match: "3a84e27f01"
```
