---
name: "Unencoded-Digest"
description: "Carries a hash of the full representation with no content coding applied, so a client that decoded gzip or br can verify what it got."
category: "both"
standard: false
relatedCodes: [200, 206]
reference:
  title: "RFC-ietf-httpbis-unencoded-digest-05, Section 3"
  url: https://datatracker.ietf.org/doc/draft-ietf-httpbis-unencoded-digest/
updatedDate: 2026-10-17
---

## What is the Unencoded-Digest header?

The `Unencoded-Digest` field carries one or more digests of the entire selected representation data with no content codings applied. It is defined in Section 3 of `draft-ietf-httpbis-unencoded-digest`, "HTTP Unencoded Digest", from the IETF HTTP Working Group. As of October 2026 the draft (revision -05) has been approved by the IESG and is in the RFC Editor queue as an intended Proposed Standard, but it has not been published as an RFC and has no RFC number yet. IANA has already registered the field name as permanent, referencing the draft. When it is published it will update RFC 9530.

It exists to fill a gap in [Digest Fields](/specifications/digest-fields). [`Repr-Digest`](/headers/repr-digest) hashes the representation including its [`Content-Encoding`](/headers/content-encoding), so a client that received gzip and decoded it, as browsers and most HTTP libraries do transparently, has to re-encode the data byte for byte to check it. That is often impractical and sometimes impossible. `Unencoded-Digest` hashes the bytes before any coding, so the client hashes what it decoded and compares.

The syntax matches `Repr-Digest`: a [Structured Field](/specifications/structured-fields) Dictionary whose keys are algorithms from the IANA "Hash Algorithms for HTTP Digest Fields" registry and whose values are byte sequences. It can be sent on requests and responses, and in a trailer section. When no content coding is applied, it has exactly the same value as `Repr-Digest` for the same algorithm.

## API Usage & Best Practices

* **Use it when clients decode transparently.** If your API serves compressed downloads and clients want to verify them, `Unencoded-Digest` is the digest they can actually check. Send it alongside `Repr-Digest` rather than instead of it, so clients that do keep the encoded bytes can still use the RFC 9530 field.
* **Check the encoded bytes before you decode them.** Verifying `Unencoded-Digest` means running untrusted content through a decompressor first. The draft suggests also sending [`Content-Digest`](/headers/content-digest) or `Repr-Digest` so the recipient can validate the received bytes before decoding them. Do that on any endpoint that accepts compressed uploads.
* **Reassembled ranges stay verifiable.** In the draft's own example, a [`206 Partial Content`](/status-codes/206) response with gzip coding carries all three fields: `Content-Digest` for the part, and `Repr-Digest` and `Unencoded-Digest` for the whole once it is stitched together.
* **Omit it with encrypting content codings.** With `aes128gcm` (RFC 8188), a digest of the plaintext in a cleartext header leaks information about that plaintext. The draft says the field SHOULD be omitted in that case unless the field itself is encrypted.
* **Pick codings that round-trip exactly.** Validation only works if decoding gives back the original bytes. The draft notes most registered content codings do, but a coding that makes semantically meaningless changes will fail every check.
* **Use `sha-256` or `sha-512`.** The deprecated algorithms in the registry should not be used where an attacker could be involved.
* **It is still a draft.** Expect libraries and gateways to lag. Treat it as optional on the receiving side until the RFC is published and your stack supports it, and do not require it from clients yet.

## Examples

These examples are from the draft. The unencoded representation is the text `An unexceptional string` followed by a line feed. A gzip-encoded full response carries different `Repr-Digest` and `Unencoded-Digest` values:

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Encoding: gzip
Repr-Digest: sha-256=:kwcdt3RBGcsLaj7QSz9AW8MuwJaLjOJqUU/jKixF2oU=:
Unencoded-Digest: sha-256=:5Bv3NIx05BPnh0jMph6v1RJ5Q7kl9LKMtQxmvc9+Z7Y=:
```

A range of the same gzip-encoded representation, with all three integrity fields:

```http
HTTP/1.1 206 Partial Content
Content-Type: text/plain
Content-Encoding: gzip
Content-Range: bytes 0-9/44
Content-Digest: sha-256=:SotB7Pa5A7iHSBdh9mg1Ev/ktAzrxU4Z8ldcCIUyfI4=:
Repr-Digest: sha-256=:kwcdt3RBGcsLaj7QSz9AW8MuwJaLjOJqUU/jKixF2oU=:
Unencoded-Digest: sha-256=:5Bv3NIx05BPnh0jMph6v1RJ5Q7kl9LKMtQxmvc9+Z7Y=:
```
