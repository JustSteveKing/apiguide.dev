---
name: "Want-Repr-Digest"
description: "Asks the other side to send a Repr-Digest of the full selected representation, with a weighted preference for hash algorithms."
category: "both"
standard: true
relatedCodes: [200, 206]
reference:
  title: "RFC 9530, Section 4"
  url: https://www.rfc-editor.org/rfc/rfc9530.html#section-4
updatedDate: 2026-10-17
---

## What is the Want-Repr-Digest header?

The `Want-Repr-Digest` field, defined in RFC 9530 Section 4, says that the sender would like to receive a [`Repr-Digest`](/headers/repr-digest), a hash of the whole selected representation, on messages associated with the request URI and representation metadata. It can be sent on requests and responses. In a response, it asks the client to provide `Repr-Digest` on future requests.

The value is a [Structured Field](/specifications/structured-fields) Dictionary with the same shape as [`Want-Content-Digest`](/headers/want-content-digest): each key is a hash algorithm from the IANA "Hash Algorithms for HTTP Digest Fields" registry, and each value is an Integer from 0 to 10, where 1 is least preferred, 10 is most preferred and 0 means "not acceptable".

```http
Want-Repr-Digest: sha-512=3, sha-256=10, unixsum=0
```

The difference from `Want-Content-Digest` is what gets hashed. A [`Content-Digest`](/headers/content-digest) covers the bytes in this message, so it changes on every [`206 Partial Content`](/status-codes/206) response. A `Repr-Digest` covers the full representation, including its [`Content-Encoding`](/headers/content-encoding), and is the same on every range of it. See [Digest Fields](/specifications/digest-fields).

## API Usage & Best Practices

* **Ask for it when you will reassemble.** A client downloading a large file in ranges wants `Repr-Digest`, because it is the one value it can check the stitched-together whole against. For a single small response, `Want-Content-Digest` is usually what you mean.
* **It is only a hint.** The receiver may ignore it, pick a different algorithm, or omit the digest entirely, and none of that is a protocol error. Build your client so a missing `Repr-Digest` degrades to "unverified", not to a crash.
* **Remember that encoding is part of the representation.** A gzip-encoded representation has a different `Repr-Digest` from the identity one. If the client cannot easily re-encode what it decoded, it may be better served by `Want-Unencoded-Digest`, which asks for a digest of the representation with no content coding applied (see [`Unencoded-Digest`](/headers/unencoded-digest)).
* **Weight the active algorithms.** Give `sha-256` and `sha-512` non-zero weights and use 0 to rule out deprecated ones such as `md5` or `unixsum`.
* **It replaces `Want-Digest`.** RFC 9530 obsoletes RFC 3230's `Want-Digest`. Do not send both; send the RFC 9530 field.

## Examples

A client that will fetch a file in parts asking for a representation digest:

```http
GET /v1/exports/exp_9f2/download HTTP/1.1
Host: api.example.com
Range: bytes=0-1048575
Want-Repr-Digest: sha-256=10
```

The range response carries the representation digest (illustrative value), which will be identical on every other range of the same file:

```http
HTTP/1.1 206 Partial Content
Content-Type: application/octet-stream
Content-Range: bytes 0-1048575/52428800
Repr-Digest: sha-256=:RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:
```

A server asking clients to send `Repr-Digest` on future uploads:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Want-Repr-Digest: sha-256=10, sha-512=5
```
