---
name: "Retry-After"
description: "Tells the client how long to wait before making a follow-up request."
category: "response"
standard: true
relatedCodes: [429, 503]
---

## What is the Retry-After header?

The `Retry-After` response header tells the client how long they should wait before retrying the request. 

## API Usage & Best Practices

* **Required on 429 & 503**: Always include this header when rate limiting a client or undergoing planned maintenance.
* **Value representation**: Can be expressed either as a decimal integer of seconds to wait (e.g. `Retry-After: 120`) or as an HTTP-date. Seconds are generally preferred in APIs.

## Examples

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```
