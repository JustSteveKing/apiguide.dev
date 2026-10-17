---
title: Missing Signature
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['invalid-signature', 'unauthorized', 'digest-mismatched-values']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`401 Unauthorized`](/status-codes/401) with a Missing Signature error when an endpoint requires signed requests and the request does not carry the signature it needs. That covers three cases: no [`Signature`](/headers/signature) and [`Signature-Input`](/headers/signature-input) fields at all, signatures present but none from a key you accept for this caller, and a signature that does not cover the components your profile requires, such as one over `@method` and `@path` when you require `@target-uri` and `content-digest` as well.

It applies equally to [HTTP Message Signatures](/specifications/http-message-signatures) (RFC 9421) and to the HMAC schemes most webhook senders use, described in the [webhook signatures guide](/guides/webhook-signatures). In both, the signature is how the receiver knows who sent the request, which is why 401 is the right code: the request lacks the credential that authenticates it. RFC 9421 leaves error handling to the application, and notes that 401 or 403 could be appropriate when a signature is used for authentication.

RFC 9110 requires every 401 to carry a [`WWW-Authenticate`](/headers/www-authenticate) header with at least one challenge. RFC 9421 does not define an authentication scheme, so send the challenge your signing profile documents. For RFC 9421, also send `Accept-Signature`, which RFC 9421 defines for exactly this: in a response, it tells the client how to sign its next request.

## When not to use it

Do not use it when a signature is present, covers the right components and comes from a known key, but fails to verify. That is `invalid-signature`. The split matters to the client: a missing signature is a configuration or integration bug, while an invalid one can be a clock problem, a body that changed in transit, or an attack.

Do not use it when the signature fields are present but do not parse as Structured Fields. That is a plain [`400 Bad Request`](/status-codes/400): the client sent something malformed, not something unsigned.

Do not use it when the request has no credentials of any kind on an endpoint where a signature is optional. If signing is optional, an unsigned request is either accepted or fails for another reason, such as a missing token, which is `unauthorized`.

Do not use it when the problem is the body digest rather than the signature. A [`Content-Digest`](/headers/content-digest) that does not match the body is `digest-mismatched-values`, even if the signature covering that field verifies.

## Example response

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
WWW-Authenticate: Signature realm="payments-api"
Accept-Signature: sig1=("@method" "@target-uri" "content-digest");created;keyid="client-key-2026"

{
  "type": "https://apiguide.dev/errors/missing-signature",
  "title": "Missing Signature",
  "status": 401,
  "detail": "Requests to this endpoint must be signed with HTTP Message Signatures, covering @method, @target-uri and content-digest.",
  "instance": "/v1/transfers",
  "requiredComponents": ["@method", "@target-uri", "content-digest"]
}
```

`Signature` here is not a registered authentication scheme: it stands for whatever name your signing profile documents. The [request signing guide](/guides/request-signing) covers choosing the components to require.

A webhook receiver is the server in this exchange, so it returns this response to the sender. Most senders treat any non-2xx response as a failed delivery and retry, so the body mostly ends up in the sender's delivery logs. Make the `detail` useful to whoever reads those.
