---
name: "Content-Length"
description: "Indicates the size of the request or response body in bytes."
category: "both"
standard: true
relatedCodes: [411, 413]
reference:
  title: "RFC 9110, Section 8.6"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-8.6
updatedDate: 2026-10-14
---

## What is the Content-Length header?

The `Content-Length` header indicates the size of the payload body in decimal number of octets (bytes) sent to the recipient.

## API Usage & Best Practices

* **Validate request sizing**: Gateways check this header to immediately reject payloads exceeding limits with a `413 Content Too Large`.
* **Reject missing lengths only if you must**: RFC 9112 lets a server answer a request that has a body but no `Content-Length` with `411 Length Required`, but every HTTP/1.1 recipient must be able to parse chunked bodies, so reserve 411 for a server that genuinely cannot accept a body of unknown length, such as one that has to enforce a size limit before reading. An explicit `Content-Length: 0` is a valid, empty body rather than a missing header, and shouldn't trigger 411.

## Examples

```http
POST /v1/leads HTTP/1.1
Content-Type: application/json
Content-Length: 124
```
