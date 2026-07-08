---
name: "Content-Type"
description: "Indicates the media type of the request or response body payload."
category: "both"
standard: true
relatedCodes: [415]
---

## What is the Content-Type header?

The `Content-Type` header tells the recipient how to interpret the bytes of the HTTP body (e.g. parsing it as JSON, XML, or multi-part form data).

## API Usage & Best Practices

* **Use standard types**: Modern JSON APIs should use `application/json` or `application/problem+json` for errors.
* **Validate incoming mutations**: If a client sends an unsupported type in a POST/PUT, reject it with `415 Unsupported Media Type`.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```
