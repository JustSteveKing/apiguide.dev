---
name: "Repr-Digest"
description: "Carries a hash of the full selected representation, independent of ranges and of how this message frames it."
category: "both"
standard: true
relatedCodes: [200, 206]
---

## What is the Repr-Digest header?

The `Repr-Digest` field, defined in RFC 9530 Section 3, carries one or more digests of the selected representation data: the whole representation as HTTP defines it, including its [`Content-Encoding`](/headers/content-encoding), but regardless of whether this particular message carries all of it. A [`206 Partial Content`](/status-codes/206) response or a response to [`HEAD`](/methods/head) has the same `Repr-Digest` as the full [`200 OK`](/status-codes/200), while its [`Content-Digest`](/headers/content-digest) changes with the bytes actually sent.

The value has the same syntax as `Content-Digest`: a [Structured Field](/specifications/structured-fields) Dictionary of algorithm key to base64 byte sequence, using the IANA "Hash Algorithms for HTTP Digest Fields" registry. `sha-256` and `sha-512` are "Active"; the rest are "Deprecated". It can be sent on requests and responses, and in a trailer section.

`Repr-Digest` is the direct replacement for the `Digest` field of RFC 3230, which RFC 9530 obsoletes along with `Want-Digest`. `Digest` was always meant to hash the representation; `Repr-Digest` says so in its name. See [Digest Fields](/specifications/digest-fields).

## API Usage & Best Practices

* **Verify reassembled downloads**: A client fetching a large file in ranges can check each part with `Content-Digest` and the reassembled whole against `Repr-Digest`, which stays the same across every range response for that representation.
* **Encoding still matters**: The representation includes its content coding, so a gzip-encoded representation and an identity one have different `Repr-Digest` values. A client that negotiated `br` gets a different value from one that did not.
* **State-changing requests**: On a request such as [`PATCH`](/methods/patch), `Repr-Digest` is computed over the enclosed representation (the patch document), not the target resource. In the response, it is computed over the representation the response describes; when the server sends [`Content-Location`](/headers/content-location), that is the resource it names. [`Location`](/headers/location) does not change what is hashed.
* **Prefer sha-256 or sha-512**: The deprecated algorithms are for carrying forward stored RFC 3230 checksums against accidental corruption, and must not be used where an attacker could be involved.
* **Not authentication on its own**: As with `Content-Digest`, sign the field with [HTTP Message Signatures](/specifications/http-message-signatures) if you need to know who produced it.
* **Ask for it with Want-Repr-Digest**: `Want-Repr-Digest` works like `Want-Content-Digest`: a Dictionary of algorithm to preference from 1 to 10, with 0 meaning "not acceptable". In a response, it asks the client to send `Repr-Digest` on future requests. It is a hint, never a requirement the other side has to honor.

## Examples

These examples are taken from RFC 9530 Appendix B. The full representation is `{"hello": "world"}` followed by a newline. A full response has identical digests:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 19
Content-Digest: sha-256=:RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:
Repr-Digest: sha-256=:RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:

{"hello": "world"}
```

A range response for bytes 10 to 18 keeps `Repr-Digest` and changes `Content-Digest`:

```http
HTTP/1.1 206 Partial Content
Content-Type: application/json
Content-Range: bytes 10-18/19
Content-Digest: sha-256=:jjcgBDWNAtbYUXI37CVG3gRuGOAjaaDRGpIUFsdyepQ=:
Repr-Digest: sha-256=:RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:

"world"}
```

A client stating a preference:

```http
GET /items/123 HTTP/1.1
Host: foo.example
Want-Repr-Digest: sha-512=3, sha-256=10, unixsum=0
```
