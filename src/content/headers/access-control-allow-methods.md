---
name: "Access-Control-Allow-Methods"
description: "Lists the HTTP methods permitted when accessing a resource in response to a CORS preflight."
category: "response"
standard: true
relatedCodes: [204]
---

## What is the Access-Control-Allow-Methods header?

The `Access-Control-Allow-Methods` response header is sent in reply to a CORS preflight request to tell the browser which HTTP methods are allowed when making the actual cross-origin request. It answers the method announced in `Access-Control-Request-Method`.

## API Usage & Best Practices

* **Preflight only**: This header is meaningful on the `OPTIONS` preflight response (typically `204 No Content`), not on the actual request's response.
* **List real methods**: Include every method the endpoint supports, such as `GET, POST, PUT, DELETE`. The wildcard `*` is allowed but is ignored for requests that include credentials.

## Examples

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```
