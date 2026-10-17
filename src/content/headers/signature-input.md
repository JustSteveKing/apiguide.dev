---
name: "Signature-Input"
description: "Declares, per signature label, which message components an RFC 9421 HTTP Message Signature covers and with which parameters it was made."
category: "both"
standard: true
relatedCodes: [400, 401]
---

## What is the Signature-Input header?

The `Signature-Input` header, defined in Section 4.1 of [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) (HTTP Message Signatures, Standards Track, February 2024), describes how a signature on the message was produced. It always travels with the [`Signature`](/headers/signature) header, which carries the signature bytes themselves. Either one without the other is an error.

It is a Dictionary [Structured Field](/specifications/structured-fields). Each member's key is a **label** chosen by the signer (`sig1`, `proxy_sig`), and its value is an Inner List of **covered components** followed by **signature parameters**:

```http
Signature-Input: sig1=("@method" "@path" "@authority" "content-digest");created=1618884473;keyid="test-key-ed25519"
```

Covered components are either lowercased HTTP field names (`"content-digest"`, `"content-type"`) or **derived components**, which start with `@` and are computed from the message's control data rather than read from a header:

| Component | Value |
| :--- | :--- |
| `@method` | The request method |
| `@target-uri` | The full target URI |
| `@authority` | The authority (host and port) of the target URI |
| `@scheme` | The URI scheme |
| `@request-target` | The request target as sent on the wire |
| `@path` | The absolute path, without the query |
| `@query` | The query, including the leading `?` |
| `@query-param` | A single named query parameter, `"@query-param";name="id"` |
| `@status` | The response status code (responses only) |

The parameters [RFC 9421](/specifications/http-message-signatures) defines are `created` and `expires` (integer Unix timestamps; `created` is RECOMMENDED), `nonce`, `alg`, `keyid` and `tag`, all strings except the two timestamps.

The verifier rebuilds the **signature base** from this header: one line per covered component, in the declared order, then a final `"@signature-params"` line whose value is the Inner List exactly as it appears in `Signature-Input`. The RFC requires the header to carry the same serialized value used in that last line, so order and parameters are part of what is signed.

## API Usage & Best Practices

* **Cover enough to make the message unique.** RFC 9421 Section 7.2.2 points out that a signature over too few components can be lifted onto a different message. At a minimum, sign `@method`, `@authority`, `@path` (or `@target-uri`), `@query` if you use one, and [`Content-Digest`](/headers/content-digest) for any request with a body.
* **Sign the body through `Content-Digest`, never directly.** RFC 9421 has no component for the content. Compute a `Content-Digest` (RFC 9530, see [Digest Fields](/specifications/digest-fields)), add it as a header, and list `"content-digest"` as a covered component. The verifier must also recompute the digest over the received body; a valid signature over a digest that does not match the body proves nothing.
* **Always include `created`, and enforce a maximum age.** The verifier decides the window, not the signer. Reject signatures whose `created` is too far in the past or the future, and treat `expires` as a hint you may tighten, never loosen.
* **Do not let `alg` choose the algorithm.** Section 7.3.6 describes the downgrade where an attacker swaps RSA-PSS for HMAC and a naive verifier uses the public key as the HMAC secret. Bind the algorithm to the key behind `keyid` in your own configuration, and reject any `alg` that disagrees with it. Section 3.2.1 explicitly allows an application to prohibit `alg` when the key determines the algorithm.
* **Publish your required coverage as a profile.** Section 3.2.1 expects applications to add requirements: which components must be covered, which algorithms are allowed, maximum age, whether `nonce` is mandatory. Write them down and fail verification when a signature does not meet them, even if it is cryptographically valid.
* **Do not sign what an intermediary will legitimately change.** Hop-by-hop fields such as [`Connection`](/headers/connection) and [`Transfer-Encoding`](/headers/transfer-encoding) are rewritten in transit. `@authority` changes too when a reverse proxy rewrites the host, which is exactly the case RFC 9421 Section 4.3 walks through. Verify at the first component that sees the original message, or have the proxy verify and add its own signature.
* **Keep it in headers, not trailers.** The RFC allows a trailer but RECOMMENDS a header, because intermediaries may drop trailers.
* **Ask for signatures with `Accept-Signature`.** Section 5 defines [`Accept-Signature`](/headers/accept-signature), a Dictionary with the same shape as `Signature-Input`. In a request it asks the server to sign the response; in a response it asks the client to sign its next request. Parameters such as `created` appear without a value, meaning "include one". A server that signs responses on request should mark them uncacheable or add `Accept-Signature` to [`Vary`](/headers/vary).

## Examples

A request signed with Ed25519, taken from the test vector in RFC 9421 Appendix B.2.6. The label `sig-b26` ties the input to the signature. The test vector does not cover `Content-Digest`, which is fine for checking an implementation and not what you would ship:

```http
POST /foo?param=Value&Pet=dog HTTP/1.1
Host: example.com
Date: Tue, 20 Apr 2021 02:07:55 GMT
Content-Type: application/json
Content-Digest: sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:
Content-Length: 18
Signature-Input: sig-b26=("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"
Signature: sig-b26=:wqcAqbmYJ2ji2glfAMaRy4gruYYnx2nEFN2HN6jrnDnQCK1u02Gb04v9EDgwUPiu4A0w6vuQv5lIp5WPpBKRCw==:

{"hello": "world"}
```

The signature base the signer and verifier both build from that header, one line per component and the parameters last. Note that `@path` is `/foo`: the query is not part of it, so this signature does not protect `param` or `Pet`.

```text
"date": Tue, 20 Apr 2021 02:07:55 GMT
"@method": POST
"@path": /foo
"@authority": example.com
"content-type": application/json
"content-length": 18
"@signature-params": ("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"
```

A client asking the server to sign its response, covering the status and body digest, with a fresh nonce so a replayed old response cannot satisfy it:

```http
GET /v1/accounts/acc_42/balance HTTP/1.1
Host: api.example.com
Accept-Signature: sig1=("@status" "content-type" "content-digest");created;keyid="server-key-2026";nonce="m4zpWCbNSDbqAFwr"
```
