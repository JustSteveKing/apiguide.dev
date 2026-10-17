---
name: "Accept-Patch"
description: "Advertises which patch document media types a resource accepts in PATCH requests, and by its presence that PATCH is allowed at all."
category: "response"
standard: true
relatedCodes: [200, 415]
reference:
  title: "RFC 5789"
  url: https://www.rfc-editor.org/rfc/rfc5789.html
updatedDate: 2026-10-14
---

## What is the Accept-Patch header?

The `Accept-Patch` response header, defined in Section 3.1 of [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789.html) alongside the [`PATCH`](/methods/patch) method, lists the patch document formats a resource accepts. Its value is a comma-separated list of media types, with optional parameters:

```http
Accept-Patch: application/merge-patch+json, application/json-patch+json
```

A `PATCH` body is not the new state of the resource, it is a set of instructions for changing it, and its media type decides how those instructions are read. The same JSON object means something different as a [JSON Merge Patch](/specifications/json-merge-patch) (`application/merge-patch+json`, RFC 7396) than it does as a [JSON Patch](/specifications/json-patch) (`application/json-patch+json`, RFC 6902). `Accept-Patch` is how a client finds out which interpretations the server supports before it sends one.

RFC 5789 gives the header two meanings: the presence of `Accept-Patch` on a response to any method implies that `PATCH` is allowed on that resource, and each listed type is one the resource will accept.

## API Usage & Best Practices

* **Send it on `OPTIONS` for every patchable resource.** RFC 5789 says it SHOULD appear in the [`OPTIONS`](/methods/options) response for any resource that supports `PATCH`, next to an [`Allow`](/headers/allow) header listing `PATCH`.
* **Send it on `415` responses.** When a client sends a patch format you do not support, answer [`415 Unsupported Media Type`](/status-codes/415) with `Accept-Patch` listing what you do support. RFC 5789 Section 2.2 says such a response SHOULD include it, and it turns a dead end into a one-step fix.
* **Do not list `application/json` as a patch format.** Plain JSON has no defined patch semantics, so a server that accepts it has invented its own, and a client cannot tell from the header which one. Accept `application/merge-patch+json` for simple field updates and `application/json-patch+json` when clients need array operations or tests, and say so explicitly.
* **Only list a type on a resource that really takes it.** Its presence is a promise that `PATCH` works. Do not emit a blanket `Accept-Patch` on read-only resources or on collections that only take [`POST`](/methods/post).
* **Keep it out of `Accept`.** [`Accept`](/headers/accept) is a request header about response formats. `Accept-Patch` is a response header about request formats. They answer different questions, and its sibling for `POST` is [`Accept-Post`](/headers/accept-post).
* **Reject malformed patches with `400`, unprocessable ones with `422`.** RFC 5789 distinguishes a badly formatted patch document ([`400 Bad Request`](/status-codes/400)) from a valid one that cannot be applied ([`422 Unprocessable Content`](/status-codes/422)), and a failed `If-Match` precondition from both ([`412 Precondition Failed`](/status-codes/412)). See [PATCH strategies](/guides/patch-strategies).

## Examples

Discovering what a resource accepts before patching it:

```http
OPTIONS /v1/users/42 HTTP/1.1
Host: api.example.com
```

```http
HTTP/1.1 204 No Content
Allow: GET, PUT, PATCH, DELETE, OPTIONS, HEAD
Accept-Patch: application/merge-patch+json, application/json-patch+json
```

A client sent plain JSON and was told which formats would have worked:

```http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/problem+json
Accept-Patch: application/merge-patch+json, application/json-patch+json

{
  "type": "https://apiguide.dev/errors/unsupported-media-type",
  "title": "Unsupported Media Type",
  "status": 415,
  "detail": "PATCH bodies must be application/merge-patch+json or application/json-patch+json."
}
```
