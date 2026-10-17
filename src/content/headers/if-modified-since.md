---
name: "If-Modified-Since"
description: "Makes the request conditional; execution occurs only if the resource has changed since the given date."
category: "request"
standard: true
relatedCodes: [304]
reference:
  title: "RFC 9110, Section 13.1.3"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.3
updatedDate: 2026-10-14
---

## What is the If-Modified-Since header?

The `If-Modified-Since` request header is used to check if a resource has been updated since a specific timestamp.

## API Usage & Best Practices

* **Ignored when If-None-Match is present**: RFC 9110 requires a recipient to ignore `If-Modified-Since` if the request also carries [`If-None-Match`](/headers/if-none-match), because entity-tag comparison is the more accurate condition. Clients send both only for the sake of older intermediaries that might not implement `If-None-Match`.
* **Use it when there is no ETag**: It validates against [`Last-Modified`](/headers/last-modified), which has one-second resolution, so two changes within the same second are indistinguishable. Prefer [`ETag`](/headers/etag) where the server can generate one.
* **GET and HEAD only**: RFC 9110 requires the field to be ignored on any other method, and when the resource has no modification date.
* **Format requirements**: Must contain a valid HTTP date (e.g. GMT format).

## Examples

```http
GET /v1/leads HTTP/1.1
If-Modified-Since: Tue, 07 Jul 2026 10:00:00 GMT
```
