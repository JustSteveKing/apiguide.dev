---
name: "RateLimit-Remaining"
description: "Indicates the remaining number of requests the client is allowed to make in the current rate window."
category: "response"
standard: false
relatedCodes: [429]
---

## What is the RateLimit-Remaining header?

The `RateLimit-Remaining` response header indicates the remaining quota allowed for the client in the current rate window.

## API Usage & Best Practices

* **Use in tandem with limit headers**: Always send this alongside Limit and Reset headers on all API responses (not just on 429 failures) to allow clients to throttle their pace proactively.

## Examples

```http
HTTP/1.1 200 OK
RateLimit-Remaining: 84
```
