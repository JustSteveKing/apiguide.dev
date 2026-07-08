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
* **Reject empty lengths when body is expected**: If a POST request expects a body but content length is 0 or missing, return a `411 Length Required`.

## Examples

```http
POST /v1/leads HTTP/1.1
Content-Type: application/json
Content-Length: 124
```
