---
title: "Resumable Uploads for HTTP (Internet-Draft)"
description: "A reference for draft-ietf-httpbis-resumable-upload, the IETF HTTP working group draft for resuming interrupted uploads: upload resources, the Upload-Offset, Upload-Complete, Upload-Length and Upload-Limit fields, the provisional 104 status code, and its tus origins. An active Internet-Draft, not yet an RFC."
currentVersion: "draft-ietf-httpbis-resumable-upload-13"
officialUrl: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-resumable-upload/"
updatedDate: 2026-10-17
---

## What is Resumable Uploads for HTTP?

An ordinary upload is all or nothing. If a 2 GB video upload dies at 1.9 GB because a phone switched networks, the client starts again from byte zero. Every large-file API ends up inventing a fix: chunked upload sessions, multipart upload IDs, offset headers with vendor prefixes. Each is incompatible with the others, and each needs its own client code.

`draft-ietf-httpbis-resumable-upload`, "Resumable Uploads for HTTP", is the IETF HTTP working group's standard answer. It lets a server turn any upload into a resumable one by creating a temporary **upload resource**: the client can ask it how many bytes arrived, append the rest, or cancel. It grew out of the tus resumable upload protocol; the individual draft `draft-tus-httpbis-resumable-uploads-protocol` (last revision -02, 2022) was replaced by this working group document.

**Status as of October 2026:** revision -13, dated 6 October 2026, is an active Internet-Draft (WG state "WG Document", IESG state "I-D Exists"), intended for Proposed Standard. It expires on 9 April 2027 unless a new revision is posted. It is not an RFC. Field names and semantics have changed between revisions, so while it is a draft, clients send an `Upload-Draft-Interop-Version` header (revision -13 uses interop version `10`) and servers echo it in the `104` response. That header is to be removed before RFC publication.

---

## 1. The model

There are two resources in play, and keeping them apart is the key to the whole design:

| Resource | Role |
| :--- | :--- |
| The target resource | The URI the client originally uploads to, for example `POST /project/123/files`. It processes the complete representation and produces the final response. |
| The upload resource | A temporary resource the server creates for this one upload. It exists so the transfer can be resumed. It can be on a different origin. |

The client starts a normal upload and adds `Upload-Complete`. A server that supports the draft creates an upload resource and tells the client its URI straight away, in an interim response, before the upload finishes. If the connection drops, the client now has somewhere to resume from. A server that does not support it ignores the field and the request is an ordinary upload, so a client can send `Upload-Complete` everywhere at no cost.

---

## 2. Header fields

All four are [Structured Fields](/specifications/structured-fields):

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `Upload-Offset` | Integer | Bytes of the representation the server has received, or the position an append starts at |
| `Upload-Complete` | Boolean | `?1` if this request (or response) completes the upload, `?0` if more is to come |
| `Upload-Length` | Integer | Total length of the representation in bytes, when known |
| `Upload-Limit` | Dictionary | The server's constraints for this upload |

`Upload-Limit` keys defined in revision -13:

| Key | Meaning |
| :--- | :--- |
| `max-size` | Maximum representation size |
| `min-size` | Minimum size for which resumable uploads are offered |
| `max-append-size` | Maximum content in a single creation or append request |
| `min-append-size` | Minimum content in a single creation or append request |
| `max-age` | Remaining lifetime of the upload resource, in seconds |

A server must include `Upload-Limit` in a response to `OPTIONS` on a resource that supports creating uploads (using `min-size=0` if it applies no limits), so clients can discover support and limits before they start.

---

## 3. The 104 status code

The draft defines `104 (Upload Resumption Supported)`, an informational interim response. The server sends it during upload creation with a [`Location`](/headers/location) for the upload resource, and may send further `104`s to report progress through `Upload-Offset`:

```http
POST /project/123/files HTTP/1.1
Host: example.com
Content-Type: image/jpeg
Content-Length: 123456789
Upload-Length: 123456789
Upload-Complete: ?1

[content (123456789 bytes)]

HTTP/1.1 104 Upload Resumption Supported
Location: https://example.com/upload/b530ce8ff
Upload-Limit: max-size=1234567890

HTTP/1.1 104 Upload Resumption Supported
Upload-Offset: 23456789

HTTP/1.1 200 OK
Location: https://example.com/upload/b530ce8ff
Upload-Complete: ?1
Content-Type: application/json

{"attachmentId": "b530ce8ff"}
```

The code is not permanent yet. The IANA status code registry lists 104 as a **temporary** registration (registered 2024-11-13, extended 2025-09-15, expiring 2026-11-13), referencing revision -05 of the draft. The draft itself still marks 104 as a "suggested value". It becomes a permanent assignment only when the draft is published as an RFC; until then, treat it as provisional and do not build anything that cannot tolerate the number changing.

`104` works alongside [`100 Continue`](/status-codes/100), not instead of it, and like [`103 Early Hints`](/status-codes/103) it is an interim response that some HTTP stacks, intermediaries and client APIs never surface to application code. If the `104` never reaches the client, the client has no upload URI and cannot resume. The draft's fallback is "careful upload creation": send an empty creation request first, get the upload resource back in the final response, and then append the content.

---

## 4. Resuming, appending and cancelling

**Find out where to resume.** Send [`HEAD`](/methods/head) to the upload resource:

```http
HEAD /upload/c35e2cd29 HTTP/1.1
Host: example.com

HTTP/1.1 204 No Content
Upload-Complete: ?0
Upload-Offset: 25000000
Upload-Length: 100000000
Upload-Limit: max-age=3600
Cache-Control: no-store
```

**Append the rest.** Send [`PATCH`](/methods/patch) with the media type `application/partial-upload`, the offset you are starting from, and whether this request finishes the upload:

```http
PATCH /upload/c35e2cd29 HTTP/1.1
Host: example.com
Upload-Complete: ?1
Upload-Offset: 25000000
Content-Length: 75000000
Content-Type: application/partial-upload

[content (75000000 bytes)]
```

When the append completes the upload, the final response carries the target resource's result, as if the whole upload had succeeded in one request.

**Cancel.** Send [`DELETE`](/methods/delete) to the upload resource. The server should deactivate it and terminate in-flight requests to it.

| Failure | Status | Problem type |
| :--- | :--- | :--- |
| `Upload-Offset` does not match what the server has | [`409 Conflict`](/status-codes/409), with the correct `Upload-Offset` | `mismatching-upload-offset`, with `expected-offset` and `provided-offset` |
| Length values disagree across requests | [`400 Bad Request`](/status-codes/400) | `inconsistent-upload-length` |

---

## 5. Adopting it

* **Use it for large uploads over unreliable networks.** Mobile apps and browsers uploading media are the case it was built for. For small JSON bodies, retrying the whole request is simpler.
* **Prefer the draft to a home-grown chunking protocol for new work.** The model is stable even while details move, and client libraries can target one protocol instead of one per provider. If you already run tus, the draft is where that project's protocol work now happens, so plan the migration rather than extending tus further.
* **Pin a revision.** Until it is an RFC, servers and clients must agree on which revision they implement, and the interop version is how they check.
* **Expire upload resources.** Advertise `max-age` and clean up abandoned partial uploads; they consume storage and can be abused to fill it.
* **Check integrity end to end.** The draft no longer specifies digests itself. Use [Digest Fields](/specifications/digest-fields) if you need to verify the reassembled representation.
* **Do not resume with `PUT` and `Content-Range`.** That is not how the draft works, and a partial `PUT` conflicts with `PUT`'s replace-the-whole-resource semantics.

For upload design in general, presigned URLs and chunking, see [file uploads and downloads](/guides/file-uploads-downloads).
