---
name: "RateLimit-Limit"
description: "Indicates the maximum number of requests the client is permitted to make in the current rate window."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Limit header?

The `RateLimit-Limit` response header (defined in emerging IETF drafts) indicates the maximum request quota allowed for a client in their current rate-limiting window.

## API Usage & Best Practices

* **Replacing custom headers**: Historically, APIs used custom headers like `X-RateLimit-Limit`. IETF is standardizing this under `RateLimit-Limit`.
* **Define windows**: Provide details in seconds or parameters if needed, or simply return the integer count.

## Examples

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
```
