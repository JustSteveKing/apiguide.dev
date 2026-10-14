---
name: "Link"
description: "Provides a means to serialize relationships between resources in HTTP headers, commonly used for pagination."
category: "both"
standard: true
relatedCodes: [103, 200, 206]
---

## What is the Link header?

The `Link` header (RFC 8288) allows servers to express relationships between the current resource and other resources, such as pagination states.

## API Usage & Best Practices

* **Best Practice for Pagination**: Instead of packing pagination URLs inside your JSON envelope, serialize pagination links (next, prev, first, last) in the Link header. This keeps your payload focused purely on resource data.
* **Early Hints integration**: A server can send `Link` headers in a [`103 Early Hints`](/status-codes/103) interim response, before the final response is ready, so the client can start preloading or preconnecting while the server is still working. The links in a 103 are hints; the final response carries its own headers. The underlying model of link relations is described under [Web Linking](/specifications/web-linking).

## Examples

```http
HTTP/1.1 200 OK
Link: <https://api.apiguide.dev/v1/leads?page=3>; rel="next",
      <https://api.apiguide.dev/v1/leads?page=1>; rel="prev"
```
