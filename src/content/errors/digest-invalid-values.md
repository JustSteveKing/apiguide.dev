---
title: Invalid Digest Values
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['digest-mismatched-values', 'digest-unsupported-algorithms', 'malformed-request-body']
publishedDate: 2026-10-15
updatedDate: 2026-10-17
registeredType: https://iana.org/assignments/http-problem-types#digest-invalid-values
---

## When to use it

Use 400 with an Invalid Digest Values error when a [`Content-Digest`](/headers/content-digest) or [`Repr-Digest`](/headers/repr-digest) field parses, names an algorithm you support, but carries a value that algorithm could never produce. The commonest case is the wrong length: a SHA-256 digest is 32 bytes and a SHA-512 digest is 64, so anything else is wrong before you hash a single byte of content. A value that is not a Byte Sequence at all, or whose base64 does not decode, belongs here too.

Skip computing the digest when you know the value is invalid. There is nothing to compare it with, and refusing early costs less than hashing a large body for a result you already know.

This is the `digest-invalid-values` problem type from the IETF HTTPAPI working group's `draft-ietf-httpapi-digest-fields-problem-types` (Section 3.2 of revision 06), which recommends 400. IANA registered it in the HTTP Problem Types registry on 2026-06-26, so send the registered URI, `https://iana.org/assignments/http-problem-types#digest-invalid-values`, as the `type`. This page's URI resolves too and documents the same problem, but a client that recognizes registered types will only recognize the IANA one. The extension members below use the draft's names.

## When not to use it

Do not use this when the value is a well-formed digest that simply does not match the content. That is `digest-mismatched-values`.

Do not use this for an algorithm you do not support: you cannot know what a valid value looks like for an algorithm you do not implement. That is `digest-unsupported-algorithms`.

Do not use this when the field is not a valid Structured Field Dictionary in the first place, such as a missing `=` or an unterminated Byte Sequence delimiter. The draft scopes its problem types to fields that parse; answer one that does not with a plain 400.

## Example response

```json
{
  "type": "https://iana.org/assignments/http-problem-types#digest-invalid-values",
  "title": "Invalid Digest Values",
  "status": 400,
  "detail": "A digest in the request cannot have come from its hashing algorithm.",
  "instance": "/v1/items/123",
  "invalid_digests": [
    {
      "algorithm": "sha-512",
      "header": "Repr-Digest",
      "reason": "digest value is not 64 bytes long"
    }
  ]
}
```

The `reason` is for a developer reading the response, so say exactly what was wrong. An invalid value is a bug in how the client calculates or encodes the digest, so retrying the same request will fail the same way.
