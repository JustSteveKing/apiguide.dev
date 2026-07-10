---
title: "File Uploads & Downloads"
description: "Multipart uploads, presigned and resumable uploads, Range requests, Content-Disposition, and streaming."
category: "core"
---

## Introduction to File Uploads and Downloads

Transferring files over HTTP introduces concerns that ordinary JSON exchange does not: large payloads, network interruptions, memory pressure, and a wide security surface. Handling them well means picking the right mechanism for the file size and use case, leaning on HTTP's built-in features for partial transfers, and streaming rather than buffering. This guide covers upload strategies, download patterns, and the pitfalls that most often cause trouble.

---

## 1. Multipart Uploads

For the common case — a file sent alongside metadata — **`multipart/form-data`** (RFC 7578, which obsoletes RFC 2388) is the standard. The body is split into parts, each with its own [`Content-Disposition`](/headers/content-disposition) header.

```http
POST /v1/documents HTTP/1.1
Host: api.apiguide.dev
Content-Type: multipart/form-data; boundary=----boundary123

------boundary123
Content-Disposition: form-data; name="title"

Quarterly report
------boundary123
Content-Disposition: form-data; name="file"; filename="report.pdf"
Content-Type: application/pdf

%PDF-1.7 ...binary...
------boundary123--
```

Each part must carry a `form-data` disposition with a `name`; file parts should also supply a `filename`. A part's `Content-Type` defaults to `text/plain` if omitted. Multiple files for one field are sent as separate parts sharing the same `name`. This method suits files roughly in the 1MB–100MB range.

---

## 2. Presigned (Direct-to-Cloud) Uploads

For larger files or high volume, **presigned URLs** offload the transfer from your application servers. The flow:

1. The client asks your API for a temporary, time-limited upload URL.
2. Your API returns a presigned URL scoped to a cloud storage bucket (for example S3), without exposing credentials.
3. The client [`PUT`](/methods/put)s the file directly to that URL.
4. The client notifies your API that the upload finished.

```http
PUT /bucket/report.pdf?X-Amz-Signature=... HTTP/1.1
Host: storage.example-cloud.com
Content-Type: application/octet-stream

...binary...
```

This is ideal for files over 100MB. Generate presigned URLs with the **minimum necessary permissions** and **short expiration times** to limit misuse.

---

## 3. Resumable Uploads

When large uploads may be interrupted, split the file into **chunks** and let the client resume from the last acknowledged chunk. The emerging `draft-ietf-httpbis-resumable-upload` specification formalizes this with an "upload resource" and dedicated headers:

| Header | Purpose |
| --- | --- |
| `Upload-Offset` | Bytes already processed by the server |
| `Upload-Complete` | Whether the whole upload is finished |
| `Upload-Length` | Total size of the representation in bytes |
| `Upload-Limit` | Server constraints such as `max-size`, `min-size`, `max-append-size` |

A server can send an interim `104 Upload Resumption Supported` status to signal support and report progress. Note that RFC 7231 forbids a `PUT` carrying a `Content-Range` header — a server must respond `400 Bad Request` — because `PUT` replaces a whole resource. Partial writes belong to [`PATCH`](/methods/patch) or purpose-built methods.

For very small files (under ~1MB), **Base64** embedding in a JSON body is an option, but it inflates the payload by about 33% and does not scale to larger files.

---

## 4. Range Requests for Downloads

[Range requests](/headers/range) let clients fetch specific byte ranges, which powers resumable downloads and media seeking.

The server advertises support with `Accept-Ranges: bytes`. The client then sends a [`Range`](/headers/range) header:

```http
GET /v1/videos/large.mp4 HTTP/1.1
Host: api.apiguide.dev
Range: bytes=0-1023
```

A successful partial response returns [`206 Partial Content`](/status-codes/206) with a [`Content-Range`](/headers/content-range) header describing the bytes sent. An out-of-bounds range returns `416 Range Not Satisfiable`. `bytes` is the only range unit formally defined by RFC 7233.

```http
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 0-1023/2097152
Content-Length: 1024
```

---

## 5. Streaming and Content-Disposition

### Stream, do not buffer

The most common download pitfall is loading an entire file into memory before sending it — this exhausts RAM and can crash the server under concurrency. Instead, read the file in small chunks and write them straight to the response, keeping memory usage flat regardless of file size. Use asynchronous streaming and, where possible, a production static-file middleware rather than a hand-rolled endpoint per file.

### Content-Disposition

On downloads, the [`Content-Disposition`](/headers/content-disposition) response header controls client handling:

```http
Content-Disposition: attachment; filename="report.pdf"; filename*=UTF-8''report.pdf
```

* `inline` (the default) displays the content in the browser.
* `attachment` prompts a download, using the suggested filename.
* `filename*` uses RFC 5987 encoding for non-ASCII names and is preferred over `filename` when both are present.

---

## 6. Security and Error Handling

### Security

* **Validate by magic bytes**, not the client-supplied `Content-Type` — an executable can masquerade as an image.
* **Rate limit** upload endpoints to blunt denial-of-service and abuse.
* **Scan uploads for malware** before serving them back.
* **Sanitize filenames and paths** to prevent path traversal (for example `../../etc/passwd`); note that URL-encoded sequences like `..%2f` can slip past naive stripping.
* Keep presigned URLs least-privilege and short-lived.

### Error handling

Use standard status codes and a consistent, structured JSON error body:

| Status | When |
| --- | --- |
| `400 Bad Request` | Malformed request |
| `413 Content Too Large` | File exceeds size limits |
| `415 Unsupported Media Type` | Disallowed file type |
| `500 Internal Server Error` | Server-side failure |

Because a direct file response can obscure errors from the browser, download UIs sometimes fetch via JavaScript (inspecting status and `Content-Disposition`) so failures can be surfaced without a full page navigation.

In short: match the mechanism to the file size, prefer streaming and standard HTTP semantics over custom schemes, and treat every upload as untrusted input.
