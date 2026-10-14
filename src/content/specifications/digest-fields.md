---
title: "Digest Fields (RFC 9530)"
description: "A reference for RFC 9530, which defines Content-Digest and Repr-Digest for HTTP integrity, the Want-Content-Digest and Want-Repr-Digest preference fields, and the hash algorithm registry, and obsoletes RFC 3230's Digest header."
currentVersion: "RFC 9530"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9530.html"
---

## What is Digest Fields?

RFC 9530, published as a Proposed Standard in February 2024, defines HTTP fields that carry a hash of the data in a message, so a recipient can check that what arrived is what was sent. It obsoletes RFC 3230 and its `Digest` and `Want-Digest` fields.

RFC 3230 failed on one ambiguity. It said the digest was computed over the "instance", and implementations disagreed about what that meant: some hashed the bytes in the message, others the full representation before range selection or content coding. Two conforming implementations could compute different values for the same response. RFC 9530 resolves it by splitting the job into two fields with names that say what they hash.

A digest on its own is integrity against accident, not against an attacker: anyone who can change the body can recompute the digest. Authenticity comes from signing the digest field, which is exactly how [HTTP Message Signatures](/specifications/http-message-signatures) protects content.

---

## 1. Content-Digest and Repr-Digest

| Field | Hashes | Changes with |
| :--- | :--- | :--- |
| [`Content-Digest`](/headers/content-digest) | The message content: the bytes in this message, after content coding | Range, `Content-Encoding` |
| [`Repr-Digest`](/headers/repr-digest) | The whole selected representation data, after content coding | `Content-Encoding`, but not range |

Both are Dictionary [Structured Fields](/specifications/structured-fields). Each key names an algorithm and each value is a Byte Sequence, base64 between colons. Several algorithms can be sent at once to support recipients with different capabilities.

The difference shows up on a range request. RFC 9530 Appendix B.3 fetches bytes 10 to 18 of the 19-byte document `{"hello": "world"}` followed by a newline:

```http
GET /items/123 HTTP/1.1
Host: foo.example
Range: bytes=10-18

HTTP/1.1 206 Partial Content
Content-Type: application/json
Content-Range: bytes 10-18/19
Content-Digest: sha-256=:jjcgBDWNAtbYUXI37CVG3gRuGOAjaaDRGpIUFsdyepQ=:
Repr-Digest: sha-256=:RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:

"world"}
```

`Content-Digest` covers the nine bytes in this response. `Repr-Digest` covers the whole document, so a client reassembling a download from several ranges can check the final result against it.

Because both are computed after content coding, the same resource served with and without `gzip` has different digests. Sign `Content-Type` and `Content-Encoding` alongside the digest, or an attacker can alter them and make a valid digest fail.

---

## 2. Which one to use

For API request and response bodies, and for webhooks, use `Content-Digest`. It hashes exactly the bytes the recipient has in hand, needs no understanding of representations, and is the field RFC 9421 examples sign.

Reach for `Repr-Digest` when you serve ranges or resumable downloads and want an end-to-end check on the reassembled object, or when you need to assert something about a representation that is not in the message: a `HEAD` response, or a digest of an empty string to state that a message has no content at all.

Do not compute `Content-Digest` over the decoded body. If the response is gzipped, the digest is over the gzipped bytes. Getting this backwards is the same mistake that sank RFC 3230.

---

## 3. Want-Content-Digest and Want-Repr-Digest

The preference fields ask the other side to send a digest and say which algorithms it would like. Each key is an algorithm and each value an Integer from 0 to 10: 10 is most preferred, 1 least, and 0 means not acceptable.

```http
Want-Content-Digest: sha-512=3, sha-256=10, unixsum=0
```

In a request, it asks the server to include `Content-Digest` in the response. In a response, it asks the client to include it on future requests. Either way it is a hint: the recipient may use another algorithm or send nothing, and that is not a protocol error. If your API requires a digest, say so in its contract and reject requests without one rather than relying on these fields.

---

## 4. The algorithm registry

RFC 9530 creates the Hash Algorithms for HTTP Digest Fields registry at IANA, with three statuses: Active, Provisional and Deprecated. Its current contents:

| Key | Algorithm | Status |
| :--- | :--- | :--- |
| `sha-512` | SHA-512 | Active |
| `sha-256` | SHA-256 | Active |
| `md5` | MD5 | Deprecated |
| `sha` | SHA-1 | Deprecated |
| `unixsum` | UNIX `sum` | Deprecated |
| `unixcksum` | UNIX `cksum` | Deprecated |
| `adler` | Adler-32 | Deprecated |
| `crc32c` | CRC32c | Deprecated |

Deprecated algorithms MAY be used to detect corruption but MUST NOT be used where an attacker is in play, which includes any digest that is signed. Use `sha-256` unless you have a reason to pay for `sha-512`. The deprecated entries exist so systems migrating from RFC 3230 with stored checksums are not forced to recompute them.

---

## 5. Migrating from RFC 3230

The old `Digest` field is now marked obsoleted in the IANA field registry. Its syntax differs: it was a list of case-insensitive `algorithm=value` pairs whose encoding was set by each algorithm, so values arrived as base64, hex or decimal (`SHA=thvDyvhfIqlvFe+A9MYgxAfm1q5=,unixsum=30637` in RFC 3230's own example). The new fields always use Structured Field Byte Sequences and lowercase keys.

`Digest` was always meant to hash the representation, so it maps to `Repr-Digest`, not `Content-Digest`. If your old implementation hashed the message bytes, as many did, `Content-Digest` is what it was really doing all along. Emit the new field, accept the old one for a deprecation period if you have clients that send it, and do not send both with different meanings.
