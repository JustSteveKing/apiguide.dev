---
title: Mismatched Digest Values
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['digest-invalid-values', 'digest-unsupported-algorithms', 'malformed-request-body']
publishedDate: 2026-10-15
updatedDate: 2026-10-17
registeredType: https://iana.org/assignments/http-problem-types#digest-mismatched-values
---

## When to use it

Use 400 with a Mismatched Digest Values error when a request carries a [`Content-Digest`](/headers/content-digest) or [`Repr-Digest`](/headers/repr-digest) field, the digest uses an algorithm you support, and the value you compute over the content does not match the one the client sent. Something changed the bytes between the client hashing them and you receiving them: a proxy that re-encoded the body, a truncated upload, a client bug that hashed one thing and sent another.

Reject the whole request, even if the same field carries a second digest that does match. A client that sends `sha-256` and `sha-512` side by side and gets one wrong has a problem worth surfacing, and accepting the request on the strength of whichever digest happens to match weakens the check for everyone.

This is the `digest-mismatched-values` problem type from the IETF HTTPAPI working group's `draft-ietf-httpapi-digest-fields-problem-types` (Section 3.3 of revision 06), which recommends 400. IANA registered it in the HTTP Problem Types registry on 2026-06-26, so send the registered URI, `https://iana.org/assignments/http-problem-types#digest-mismatched-values`, as the `type`. This page's URI resolves too and documents the same problem, but a client that recognizes registered types will only recognize the IANA one. The extension members below use the draft's names.

## When not to use it

Do not use this when the digest value could never have come from its algorithm, such as a `sha-512` value that is 32 bytes long. That is `digest-invalid-values`: the sender encoded it wrong, and comparing it to anything is pointless.

Do not use this when the request names only algorithms you do not support. That is `digest-unsupported-algorithms`, and the fix is a different algorithm rather than a retry.

Do not use this when the field itself does not parse as a Structured Field Dictionary. The draft says its problem types apply only once the field has parsed; a field that does not is a plain 400.

## Example response

```json
{
  "type": "https://iana.org/assignments/http-problem-types#digest-mismatched-values",
  "title": "Mismatched Digest Values",
  "status": 400,
  "detail": "A digest in the request does not match its content. It may have been changed in transit.",
  "instance": "/v1/items/123",
  "mismatched_digests": [
    {
      "algorithm": "sha-256",
      "provided_digest": ":RK/0qy18MlBSVnWgjwz6lZEWjP/lF5HF9bvEF8FabDg=:",
      "header": "Content-Digest"
    }
  ]
}
```

Each entry names the algorithm, the field it came from, and the digest the client sent, serialized as a Structured Field Byte Sequence. Never include the digest you computed: the draft leaves it out deliberately, because handing it back turns the endpoint into an oracle for whatever content an attacker wants hashed.

A mismatch is often transient, so a client can reasonably retry the identical request once. If it fails again, the bytes are being changed on the way and retrying will not help.
