---
name: "Content-Range"
description: "Indicates which portion of a resource is delivered in a partial response."
category: "response"
standard: true
relatedCodes: [206, 416]
---

## What is the Content-Range header?

The `Content-Range` response header describes where a returned chunk of data fits within the complete resource. It accompanies a `206 Partial Content` response and states the byte range being sent along with the total size of the full representation.

## API Usage & Best Practices

* **Reassembling downloads**: Clients use the range and total-length values to place each chunk correctly and to know when the whole resource has been received.
* **Signalling unsatisfiable ranges**: In a `416 Range Not Satisfiable` response, `Content-Range: bytes */146515` reports the total size so the client can retry with a valid range.

## Examples

```http
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/146515
Content-Length: 1024
```
