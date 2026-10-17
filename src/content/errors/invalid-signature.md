---
title: Invalid Signature
statusCode: 401
statusText: Unauthorized
category: client-error
relatedCodes: ['missing-signature', 'unauthorized', 'digest-mismatched-values']
publishedDate: 2026-10-17
---

## When to use it

Use [`401 Unauthorized`](/status-codes/401) with an Invalid Signature error when a request carries the signature your endpoint requires, and that signature fails verification. Typical causes:

- The signature value does not match the signature base you reconstruct, because a covered component was changed in transit or the client built the base differently.
- The `keyid` names a key you do not know, or one that has been revoked.
- The `created` timestamp is outside your tolerance window, or `expires` has passed.
- The `alg` parameter disagrees with the algorithm bound to the key.
- The `nonce` has been seen before, so the request is a replay.

This applies to [HTTP Message Signatures](/specifications/http-message-signatures) (RFC 9421) in the [`Signature`](/headers/signature) and [`Signature-Input`](/headers/signature-input) fields, and to the HMAC signatures webhook senders put in their own headers. The signature is the credential that authenticates the sender, and it is not valid, so 401 is the code. RFC 9421 leaves the choice to the application and notes that 401 or 403 could be appropriate when a signature is used for authentication. Pick 401, because the fix is a correct signature, not a different permission.

RFC 9110 requires every 401 to carry a [`WWW-Authenticate`](/headers/www-authenticate) challenge. Send the one your signing profile documents.

## When not to use it

Do not use it when there is no signature, or none that covers the components you require. That is `missing-signature`: verification never got started.

Do not use it when the signature fields do not parse. That is a plain [`400 Bad Request`](/status-codes/400).

Do not use it when the signature verifies but the body does not match its [`Content-Digest`](/headers/content-digest). The signature proves the digest was not changed; the digest check is what failed, which is `digest-mismatched-values`.

Do not use it when the signature verifies and the authenticated caller is simply not allowed to do this. That is `forbidden` (403).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/invalid-signature",
  "title": "Invalid Signature",
  "status": 401,
  "detail": "The signature sig1 was created outside the allowed window of 300 seconds. Check the signer's clock and sign the request again.",
  "instance": "/v1/transfers",
  "signatureLabel": "sig1",
  "reason": "created_out_of_window"
}
```

Say which check failed, with a stable `reason` a client can branch on, such as `created_out_of_window`, `unknown_key` or `verification_failed`. Do not say more than that. Never return the signature base you computed or the signature you expected: the first helps an attacker see exactly what you verified, and the second hands them a valid signature. Compare signatures in constant time, as the [webhook signatures guide](/guides/webhook-signatures) explains, so the response time does not leak what the body does not.
