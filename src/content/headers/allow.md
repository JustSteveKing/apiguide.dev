---
name: "Allow"
description: "Lists the HTTP methods supported by the target resource, on a 405 Method Not Allowed or a 2xx OPTIONS response."
category: "response"
standard: true
relatedCodes: [405]
---

## What is the Allow header?

The `Allow` response header lists the set of HTTP methods supported by a resource. It is required on any `405 Method Not Allowed` response, and is equally standard on a successful `OPTIONS` response, where it's the primary way a client discovers what a resource supports.

## API Usage & Best Practices

* **Always send on 405**: When rejecting a request due to an unsupported method, always include `Allow: GET, POST, HEAD` (matching the supported methods for that path).
* **Also send on OPTIONS**: A `200 OK` response to `OPTIONS` should carry the same header so clients can probe supported methods without triggering an error.
* **Do not include trailing commas**: The methods should be comma-separated, like `GET, POST, PUT`.

## Examples

```http
HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD
Content-Type: application/problem+json
```
