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

* **Send it on 429 and 503**: The specs make it optional (RFC 6585 says a 429 MAY include it, RFC 9110 says a server MAY send it with a 503), but send it anyway whenever you know when capacity returns. Without it, a client can only guess at a backoff. RFC 9110 also defines it on 3xx responses, as the minimum wait before following the redirect.
* **Value representation**: Can be expressed either as a decimal integer of seconds to wait (e.g. `Retry-After: 120`) or as an HTTP-date. Seconds are generally preferred in APIs.

## Examples

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```
