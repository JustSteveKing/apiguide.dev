---
name: "Allow"
description: "Lists the HTTP methods supported by the target resource in response to a 405 Method Not Allowed."
category: "response"
standard: true
relatedCodes: [405]
---

## What is the Allow header?

The `Allow` response header lists the set of HTTP methods supported by a resource. It is required to be sent in any `405 Method Not Allowed` response.

## API Usage & Best Practices

* **Always send on 405**: When rejecting a request due to an unsupported method, always include `Allow: GET, POST, HEAD` (matching the supported methods for that path).
* **Do not include trailing commas**: The methods should be comma-separated, like `GET, POST, PUT`.

## Examples

```http
HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD
Content-Type: application/problem+json
```
