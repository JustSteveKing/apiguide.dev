---
name: "Content-Length"
description: "Indicates the size of the request or response body in bytes."
category: "both"
standard: true
relatedCodes: [411, 413]
---

## What is the Content-Length header?

The `Content-Length` header indicates the size of the payload body in decimal number of octets (bytes) sent to the recipient.

## API Usage & Best Practices

* **Validate request sizing**: Gateways check this header to immediately reject payloads exceeding limits with a `413 Payload Too Large`.
* **Reject missing lengths when body is expected**: If a POST or PUT request expects a body but the header is omitted entirely (chunked or streamed without it), return a `411 Length Required`. An explicit `Content-Length: 0` is a valid, empty body — not a missing header — and shouldn't trigger 411.

## Examples

```http
POST /v1/leads HTTP/1.1
Content-Type: application/json
Content-Length: 124
```
