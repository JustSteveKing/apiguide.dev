---
name: "TRACE"
description: "Performs a message loop-back test along the path to the target resource for diagnostics."
safe: true
idempotent: true
cacheable: false
relatedCodes: [200, 405]
---

## What is the TRACE method?

The `TRACE` method is used by clients to perform a diagnostic loopback test, asking the server to echo back the received request so the client can see what intermediaries changed along the way.

## API Usage & Best Practices

* **Diagnostics only**: Use TRACE to inspect how proxies and gateways modify a request as it travels the chain, never for business logic.
* **Often disabled**: Many servers reject TRACE with 405 because it enables Cross-Site Tracing (XST) attacks that can leak sensitive headers.
* **No request body**: Per RFC 9110 a client must not send a body with TRACE, and the server reflects the request in the response.

## Common Response Codes

* **200 OK**: The server returns the received request message in the body for inspection.
* **405 Method Not Allowed**: TRACE is disabled on the server, a common hardening measure.
