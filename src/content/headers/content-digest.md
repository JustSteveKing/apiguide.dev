---
name: "Content-Digest"
description: "Carries a hash of the actual message content, so the recipient can check the bytes arrived intact."
category: "both"
standard: true
relatedCodes: [200, 206]
---

## What is the Content-Digest header?

The `Content-Digest` field, defined in RFC 9530 Section 2, carries one or more digests of the message content: the bytes of the body as actually sent, after any [`Content-Encoding`](/headers/content-encoding) has been applied and limited to the range in a [`206 Partial Content`](/status-codes/206) response. It can be sent on requests and responses, and in a trailer section.

The value is a [Structured Field](/specifications/structured-fields) Dictionary. Each key is a hash algorithm from the IANA "Hash Algorithms for HTTP Digest Fields" registry, and each value is the digest as a byte sequence, base64 between colons. `sha-256` and `sha-512` are the registry's "Active" algorithms; `md5`, `sha` (SHA-1), `unixsum`, `unixcksum`, `adler` and `crc32c` are "Deprecated".

RFC 9530 obsoletes RFC 3230, and with it the old `Digest` and `Want-Digest` fields. Do not emit those in new work. `Digest` was meant to hash the representation, but implementations disagreed about whether that meant the content, which is why the replacement splits the job into `Content-Digest` and [`Repr-Digest`](/headers/repr-digest). See [Digest Fields](/specifications/digest-fields) for the full specification.

## API Usage & Best Practices

* **Content or representation?** Use `Content-Digest` when you want to verify the exact bytes in this message, for example a webhook body or a signed request. Use `Repr-Digest` when you care about the resource's full representation independent of ranges, such as checking a reassembled download.
* **Use sha-256 or sha-512**: The deprecated algorithms must not be used where an attacker could be involved, such as a digest that is covered by a signature. They are only there for migrating stored RFC 3230 checksums.
* **A digest alone is not authentication**: Anyone who can change the body can recompute the digest. To prove who sent the content, cover `Content-Digest` with [HTTP Message Signatures](/specifications/http-message-signatures) (see [`Signature`](/headers/signature)). Signing the digest is how a signature protects the body.
* **Compute it after encoding**: Because it covers the bytes on the wire, a gzip-encoded body and its uncompressed form have different `Content-Digest` values. Compute it on the final bytes, after compression.
* **Ask for it with Want-Content-Digest**: A client sends [`Want-Content-Digest`](/headers/want-content-digest) to request a content digest, and a server sends it in a response to ask clients to include one on future requests. It is a Dictionary of algorithm to preference, 1 (least preferred) to 10 (most preferred), with 0 meaning "not acceptable". It is only a hint; the recipient may ignore it.
* **Reject mismatches**: If a digest you require does not match, refuse the request with [`400 Bad Request`](/status-codes/400) rather than processing a body you cannot trust.

## Examples

A request carrying a digest of its body:

```http
POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 35
Content-Digest: sha-256=:kS5noiNBB8bB3tb+nPoVeQlO6I16ckYSFzTQ91VVpZM=:

{"id":"ord_123","status":"shipped"}
```

A client asking for SHA-512 if possible, SHA-256 otherwise, and never the Unix `sum` checksum:

```http
GET /v1/exports/exp_9f2/download HTTP/1.1
Host: api.example.com
Want-Content-Digest: sha-512=10, sha-256=3, unixsum=0
```
