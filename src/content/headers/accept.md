---
name: "Accept"
description: "Specifies the media types that the client is willing to receive in the response."
category: "request"
standard: true
relatedCodes: [406]
---

## What is the Accept header?

The `Accept` request header tells the server which media types (like JSON, XML, or HTML) the client is able to process. It enables content negotiation, allowing the same URL to serve different formats depending on client capability.

## API Usage & Best Practices

* **Always require it in strict APIs**: If your API only supports JSON, validate that the client accepts JSON.
* **Fallback gracefully**: If the client specifies an Accept value your API cannot satisfy, return a `406 Not Acceptable` response.

## Examples

```http
GET /v1/leads HTTP/1.1
Host: api.apiguide.dev
Accept: application/json
```
