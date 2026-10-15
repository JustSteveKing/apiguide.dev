---
title: Unsupported Hashing Algorithms
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['digest-mismatched-values', 'digest-invalid-values', 'unsupported-media-type']
publishedDate: 2026-10-15
---

## When to use it

Use 400 with an Unsupported Hashing Algorithms error when the only digests a request carries, in [`Content-Digest`](/headers/content-digest) or [`Repr-Digest`](/headers/repr-digest), use algorithms you do not support. You cannot check the content, so you cannot accept the integrity claim the client made.

The usual cause is a client still using one of the algorithms [Digest Fields](/specifications/digest-fields) registers as Deprecated: `md5`, `sha`, `unixsum`, `unixcksum`, `adler` or `crc32c`. RFC 9530 says those MUST NOT be used where an attacker could be involved, which describes any public API, so supporting only `sha-256` and `sha-512` is the right default and this error is how a client finds that out.

Tell the client what would work. Send `Want-Content-Digest` and `Want-Repr-Digest` on the response, listing the algorithms you accept with a weight from 1 to 10, so it can retry with one of them.

This mirrors the `digest-unsupported-algorithms` problem type in the IETF HTTPAPI working group's Internet-Draft `draft-ietf-httpapi-digest-fields-problem-types` (revision 06 at the time of writing), which recommends 400. Its type URI is not yet in the IANA HTTP Problem Types registry, so use this page's today. The extension members use the draft's names.

## When not to use it

Do not use this when at least one digest in the field uses an algorithm you support and checks out. RFC 9530 lets a recipient ignore digests it does not understand, which is what lets a client send a new algorithm alongside an established one during a migration. Ignore the unknown members and accept the request.

Do not use this just because a `Want-Content-Digest` or `Want-Repr-Digest` on a request names only algorithms you do not support. The draft allows it, but RFC 9530 makes those fields hints and says ignoring them is not a protocol error. Serve the response without the digest rather than failing a request the client could otherwise have used.

Do not use this for a supported algorithm with a bad value. That is `digest-invalid-values` or `digest-mismatched-values`.

## Example response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Want-Content-Digest: sha-256=10, sha-512=10
Want-Repr-Digest: sha-256=10, sha-512=10
```

```json
{
  "type": "https://apiguide.dev/errors/digest-unsupported-algorithms",
  "title": "Unsupported Hashing Algorithms",
  "status": 400,
  "detail": "None of the hashing algorithms in the request is supported. Use sha-256 or sha-512.",
  "instance": "/v1/items/123",
  "unsupported_algorithms": [
    {
      "algorithm": "md5",
      "header": "Content-Digest"
    }
  ]
}
```

List one entry per unsupported algorithm per field, so a client that sent both `Content-Digest` and `Repr-Digest` can see each one it needs to change.
