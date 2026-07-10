---
name: "Last-Modified"
description: "The date and time a resource was last changed, used for cache validation."
category: "response"
standard: true
relatedCodes: [200, 304, 412]
---

## What is the Last-Modified header?

The `Last-Modified` response header, defined in RFC 9110, carries an HTTP-date indicating when the origin server believes the resource was last modified. Clients store it and use it to ask whether their cached copy is still current.

## API Usage & Best Practices

* **Conditional requests**: Clients send the stored value back in `If-Modified-Since`; if the resource has not changed, the server replies with `304 Not Modified` and no body, saving bandwidth.
* **Guarding writes**: Sending the value in `If-Unmodified-Since` lets the server reject a request with `412 Precondition Failed` if the resource changed in the meantime.
* **Weaker than ETag**: Its one-second resolution can miss rapid updates, so `ETag` is preferred when available and takes priority when both are present.

## Examples

```http
HTTP/1.1 200 OK
Last-Modified: Wed, 08 Jul 2026 10:15:00 GMT
```
