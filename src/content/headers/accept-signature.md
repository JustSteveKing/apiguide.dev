---
name: "Accept-Signature"
description: "Asks the other side to sign its message with RFC 9421 HTTP Message Signatures, naming the label, covered components and parameters."
category: "both"
standard: true
relatedCodes: [400, 401]
reference:
  title: "RFC 9421, Section 5.1"
  url: https://www.rfc-editor.org/rfc/rfc9421.html#section-5.1
updatedDate: 2026-10-17
---

## What is the Accept-Signature header?

The `Accept-Signature` field, defined in Section 5.1 of [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) (HTTP Message Signatures), lets a potential verifier ask for a signature instead of waiting for one. Its direction decides which message it targets:

* **In a request**, it asks the server to sign the response to that request.
* **In a response**, it asks the client to sign its next request to the server. The client can choose to keep signing future requests the same way.

It is a Dictionary [Structured Field](/specifications/structured-fields) with the same shape as [`Signature-Input`](/headers/signature-input). Each member's key is the label the requested signature must use, and its value is the list of covered components, with signature parameters:

```http
Accept-Signature: sig1=("@method" "@target-uri" "@authority" "content-digest" "cache-control");keyid="test-key-rsa-pss";created;tag="app-123"
```

The parameters are requests to the signer. `created` and `expires` take no value here and ask the signer to include a creation or expiry time. `nonce`, `tag`, `alg` and `keyid` ask the signer to use the given nonce, tag, algorithm or key.

The target message must carry every requested signature, under the requested label, covering exactly the requested components, with every requested parameter processed. The signer may add more parameters and more signatures. It may also ignore a request that does not fit its application. The answer arrives in [`Signature-Input`](/headers/signature-input) and [`Signature`](/headers/signature).

## API Usage & Best Practices

* **Vary on it, or do not cache.** RFC 9421 says responses from resources that support signature negotiation SHOULD be uncacheable or carry [`Vary`](/headers/vary)`: Accept-Signature`. Otherwise a cache can serve one client's requested signature, with its nonce, to another client.
* **Request only components the target message can have.** A request cannot contain `@status`, and a response has no `@method` of its own. The sender of `Accept-Signature` MUST include only identifiers that suit the target message.
* **Use a nonce for responses you need to be fresh.** A client that asks for `nonce="..."` and checks it in the response knows the signature was made for this request, not replayed from an earlier one.
* **Do not treat it as enforcement.** The receiver MAY ignore any request it cannot fulfill. If your API requires signed requests, reject unsigned ones with [`401 Unauthorized`](/status-codes/401) and document the profile. Sending `Accept-Signature` on that `401` is a useful way to tell the client exactly what to sign.
* **Cover the body through a digest.** If you want the body signed, ask for `content-digest` among the components and expect a [`Content-Digest`](/headers/content-digest) on the message. Signatures do not cover content directly.
* **Match on key and coverage, not label alone.** Labels are local to one message. When verifying, check that the signature under the label you asked for uses the expected key and covers what you asked for.

## Examples

A client asking the server to sign the response, covering the status, content type and content digest, with a fresh creation time and a nonce it chose:

```http
GET /v1/statements/stm_2026_09 HTTP/1.1
Host: api.example.com
Accept-Signature: sig1=("@status" "content-type" "content-digest");created;keyid="server-key-2026";nonce="m4zpWCbNSDbqAFwr"
```

A server rejecting an unsigned request and telling the client how to sign the retry:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Accept-Signature: sig1=("@method" "@target-uri" "content-digest" "content-type");created;keyid="client-key-17";alg="ed25519"

{
  "type": "https://api.example.com/problems/signature-required",
  "title": "Signature required",
  "status": 401,
  "detail": "Sign the request as described in Accept-Signature."
}
```
