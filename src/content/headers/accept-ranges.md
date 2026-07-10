---
name: "Accept-Ranges"
description: "Advertises whether a server supports range requests for a resource."
category: "response"
standard: true
relatedCodes: [206]
---

## What is the Accept-Ranges header?

The `Accept-Ranges` response header tells the client whether the server supports partial requests for a resource, and which unit those ranges are measured in. The value `bytes` signals support, while `none` explicitly indicates that ranges are not supported.

## API Usage & Best Practices

* **Enables resumable transfers**: When a client sees `Accept-Ranges: bytes`, it knows it can safely send a `Range` header to resume a download or stream a portion of the resource.
* **Be explicit about no support**: Returning `Accept-Ranges: none` discourages clients from attempting range requests that the server would only answer with the full body.

## Examples

```http
HTTP/1.1 200 OK
Content-Length: 146515
Accept-Ranges: bytes
```
