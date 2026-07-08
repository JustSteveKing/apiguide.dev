---
name: "HEAD"
description: "Asks for a response identical to a GET request, but without the response body."
safe: true
idempotent: true
cacheable: true
relatedCodes: [200, 304, 404]
---

## What is the HEAD method?

The `HEAD` method requests the headers that would be returned if the corresponding GET request was executed, but without transmitting the actual response body.

## API Usage & Best Practices

* **Check existence**: Useful to check if a large resource (like a file or dataset) exists at a URL without downloading the file itself.
* **Validate cache**: Clients can send a HEAD request with conditional cache headers (`If-None-Match`) to verify if their cached copy is still fresh.
* **Header consistency**: The headers returned in a HEAD response must be identical to the headers that would have been returned by a GET request to the same URI.

## Common Response Codes

* **200 OK**: The resource exists.
* **304 Not Modified**: The client's cached version is identical.
* **404 Not Found**: The resource does not exist.
