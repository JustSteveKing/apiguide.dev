---
name: "Want-Unencoded-Digest"
description: "Asks the other side to send an Unencoded-Digest of the representation with no content coding, with a weighted algorithm preference."
category: "both"
standard: false
relatedCodes: [200]
---

## What is the Want-Unencoded-Digest header?

The `Want-Unencoded-Digest` field says that the sender would like to receive an [`Unencoded-Digest`](/headers/unencoded-digest): a digest of the representation with no content coding applied. It is defined in Section 4 of `draft-ietf-httpbis-unencoded-digest`. As of October 2026 that draft (revision -05) is approved by the IESG and waiting in the RFC Editor queue as an intended Proposed Standard; it is not yet an RFC and has no RFC number. IANA has registered the field name as permanent, referencing the draft.

It works exactly like the RFC 9530 preference fields, [`Want-Content-Digest`](/headers/want-content-digest) and [`Want-Repr-Digest`](/headers/want-repr-digest). In a request it asks the server for `Unencoded-Digest` on messages for that URI and representation metadata. In a response it asks the client to send `Unencoded-Digest` on future requests.

The value is a [Structured Field](/specifications/structured-fields) Dictionary. Each key is a hash algorithm and each value an Integer from 0 to 10: 1 is least preferred, 10 is most preferred, and 0 means "not acceptable".

```http
Want-Unencoded-Digest: sha-512=3, sha-256=10, unixsum=0
```

## API Usage & Best Practices

* **Ask for it when you decode before you verify.** A client whose HTTP library removes gzip or br before handing over the body cannot easily check a [`Repr-Digest`](/headers/repr-digest), which covers the encoded bytes. `Want-Unencoded-Digest` asks for the digest it can actually check.
* **It is only a hint.** The receiver can ignore it, use another algorithm, or send no digest, and none of that is a protocol error. A missing digest should leave the response unverified, not fail it, unless your own API contract says otherwise.
* **Send it alongside the RFC 9530 fields, not instead.** Few servers will know the draft field yet. A client that also sends `Want-Repr-Digest` gets something useful from servers that only implement RFC 9530.
* **Do not require it from clients yet.** Until the draft is published as an RFC and your gateways understand it, a server that refuses requests lacking `Unencoded-Digest` will mostly be refusing correct clients.
* **Weight only the active algorithms.** Give `sha-256` and `sha-512` non-zero weights and use 0 for deprecated ones.

## Examples

A client that decodes transparently asking for an unencoded digest, with the RFC 9530 field as a fallback:

```http
GET /v1/reports/2026-q3.csv HTTP/1.1
Host: api.example.com
Accept-Encoding: gzip, br
Want-Unencoded-Digest: sha-256=10
Want-Repr-Digest: sha-256=10
```

A server asking clients to include `Unencoded-Digest` on future uploads:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Want-Unencoded-Digest: sha-256=10, sha-512=5
```
