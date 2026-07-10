---
name: "Expect"
description: "Signals that the client expects a particular server behavior before continuing the request."
category: "request"
standard: true
relatedCodes: [100, 417]
---

## What is the Expect header?

The `Expect` request header lets a client state a requirement the server must meet before the request can proceed. Its only standardized value is `100-continue`, used when a client wants confirmation before sending a large request body.

## API Usage & Best Practices

* **Avoid wasted uploads**: With `Expect: 100-continue`, the client sends headers first and waits for a `100 Continue` before transmitting a large body, avoiding wasted bandwidth if the request would be rejected.
* **Handle rejection**: If the server cannot meet the expectation, it must respond with `417 Expectation Failed`.
* **Set a timeout**: Clients should not wait indefinitely; if no `100 Continue` arrives, they should send the body anyway after a reasonable delay.

## Examples

```http
POST /v1/uploads HTTP/1.1
Host: api.example.com
Content-Length: 10485760
Expect: 100-continue
```
