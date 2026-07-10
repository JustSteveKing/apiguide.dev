---
name: "Range"
description: "Requests only part of a resource by specifying one or more byte ranges."
category: "request"
standard: true
relatedCodes: [206, 416, 200]
---

## What is the Range header?

The `Range` request header, defined in RFC 9110, asks the server to return only a portion of a resource instead of the whole thing. It is most commonly expressed in bytes, letting clients fetch a specific slice of a file.

## API Usage & Best Practices

* **Resumable downloads**: Clients can request the bytes they are missing (for example after a dropped connection) rather than starting the transfer over from scratch.
* **Streaming & seeking**: Media players use ranges to jump ahead in audio or video without downloading everything before that point.
* **Handle the responses**: A successful partial request returns `206 Partial Content`. If the requested range cannot be satisfied, the server responds with `416 Range Not Satisfiable`; a server that ignores the header simply returns the full resource with `200 OK`.

## Examples

```http
GET /video.mp4 HTTP/1.1
Host: cdn.example.com
Range: bytes=0-1023
```
