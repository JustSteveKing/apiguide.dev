---
title: "HTTP Message Signatures (RFC 9421)"
description: "A reference for RFC 9421, the IETF standard for signing HTTP requests and responses: covered components, derived components, the signature base, signature parameters, the algorithm registry, and requesting signatures with Accept-Signature."
currentVersion: "RFC 9421"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9421.html"
updatedDate: 2026-10-14
---

## What is HTTP Message Signatures?

RFC 9421, published as a Proposed Standard in February 2024, defines how to create, carry and verify a cryptographic signature over parts of an HTTP message. It is the standards-track answer to a problem every API provider has solved privately at some point: proving that a request came from a particular key holder and that the parts that matter were not altered on the way.

The specification signs **components** rather than bytes on the wire. A signer picks which header fields and which pieces of request or response control data to cover, canonicalizes each one, and signs the resulting text. Because the canonical form survives the transformations intermediaries routinely make (header recombination, HTTP/1.1 to HTTP/2 translation, whitespace changes), a signature can be verified after the message has passed through proxies.

It deliberately does not cover the message body. To protect content, compute a digest with [Digest Fields](/specifications/digest-fields) and sign the [`Content-Digest`](/headers/content-digest) header.

It is not the same thing as `draft-cavage-http-signatures`, the earlier individual draft that RFC 9421 grew out of. That draft also used a `Signature` header, with `keyId=`, `algorithm=` and `headers=` parameters, and the two formats are not interoperable.

---

## 1. Covered components

A component identifier is either a lowercased HTTP field name or a **derived component**, whose name starts with `@` and whose value is computed from the message rather than read from a header. The registered derived components are:

| Component | Target | Value |
| :--- | :--- | :--- |
| `@method` | Request | The method, for example `POST` |
| `@target-uri` | Request | The full target URI |
| `@authority` | Request | Host and port, lowercased, default port omitted |
| `@scheme` | Request | `http` or `https` |
| `@request-target` | Request | The request target as it appears on the request line |
| `@path` | Request | The absolute path, without the query |
| `@query` | Request | The whole query string, including the leading `?` |
| `@query-param` | Request | A single named query parameter, selected with `;name="..."` |
| `@status` | Response | The three-digit status code |

Field components take parameters too: `;sf` re-serializes a [Structured Field](/specifications/structured-fields) strictly, `;key="..."` selects one Dictionary member, `;bs` wraps a field as a byte sequence, `;tr` reads it from the trailers, and `;req` lets a response signature cover a component of the request that produced it.

---

## 2. The signature base

Signer and verifier each build the same **signature base**: one line per covered component, in the declared order, followed by a final `@signature-params` line. This is the text that is actually signed. For a request from RFC 9421 Section 4.3:

```http
POST /foo?param=Value&Pet=dog HTTP/1.1
Host: example.com
Content-Type: application/json
Content-Length: 18
Content-Digest: sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:
Signature-Input: sig1=("@method" "@authority" "@path" "content-digest" "content-type" "content-length");created=1618884475;keyid="test-key-ecc-p256"
Signature: sig1=:X5spyd6CFnAG5QnDyHfqoSNICd+BUP4LYMz2Q0JXlb//4Ijpzp+kve2w4NIyqeAuM7jTDX+sNalzA8ESSaHD3A==:

{"hello": "world"}
```

the signature base is:

```text
"@method": POST
"@authority": example.com
"@path": /foo
"content-digest": sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:
"content-type": application/json
"content-length": 18
"@signature-params": ("@method" "@authority" "@path" "content-digest" "content-type" "content-length");created=1618884475;keyid="test-key-ecc-p256"
```

Note that this signature does not cover `@query`, so an attacker could change `param=Value` without breaking it. Section 7.2.1 is explicit that anything uncovered is open to modification.

---

## 3. Signature parameters

The parameters attached to the covered component list are signed along with it, as the last line of the base:

| Parameter | Type | Meaning |
| :--- | :--- | :--- |
| `created` | Integer | Creation time as a Unix timestamp. RECOMMENDED. |
| `expires` | Integer | Expiry time as a Unix timestamp |
| `nonce` | String | A unique value, for replay detection |
| `alg` | String | An algorithm name from the registry |
| `keyid` | String | Identifier for the verification key |
| `tag` | String | Application-specific label, to tell one profile's signatures from another's |

The RFC leaves policy to the application: how old a `created` may be, whether `nonce` is required, which components must be covered. Write that policy down and enforce it on every verification. A verifier that accepts whatever the signer chose to cover is checking a signature, not authenticating a request.

---

## 4. Algorithms

The HTTP Signature Algorithms registry at IANA holds six entries, all from RFC 9421:

| Name | Algorithm |
| :--- | :--- |
| `rsa-pss-sha512` | RSASSA-PSS using SHA-512 |
| `rsa-v1_5-sha256` | RSASSA-PKCS1-v1_5 using SHA-256 |
| `hmac-sha256` | HMAC using SHA-256 |
| `ecdsa-p256-sha256` | ECDSA using P-256 and SHA-256 |
| `ecdsa-p384-sha384` | ECDSA using P-384 and SHA-384 |
| `ed25519` | EdDSA using edwards25519 |

Section 3.3.7 also allows JOSE signing algorithms (other than `none`). They are not in the registry and never appear in `alg`; they are signaled through the key, typically a JWK.

Do not let the `alg` parameter choose the algorithm. The verification procedure in Section 3.2 starts from an allowlist the application knows, and if the algorithm is known from configuration, from the key, and from `alg`, all of them must agree. Bind each `keyid` to exactly one algorithm. Prefer `ed25519` or an ECDSA curve for new deployments: `hmac-sha256` means every verifier holds a key that can also sign.

---

## 5. Carrying and requesting signatures

Two Dictionary fields carry the result, keyed by the same label: [`Signature-Input`](/headers/signature-input) holds the covered components and parameters, and [`Signature`](/headers/signature) holds the signature bytes. A message can carry several signatures under different labels, which is how a reverse proxy adds its own signature alongside the client's. The RFC recommends sending both fields as headers rather than trailers, because intermediaries may drop trailers.

`Accept-Signature` is the negotiation field. In a request it asks the server to sign the response; in a response it asks the client to sign its next request. Its value has the same shape as `Signature-Input`, and a server can put a fresh `nonce` in it to defeat replay:

```http
Accept-Signature: sig1=("@method" "@target-uri" "@authority" "content-digest" "cache-control");keyid="test-key-rsa-pss";created;tag="app-123"
```

A response signed because of `Accept-Signature` must be uncacheable or carry `Vary: Accept-Signature`, so a cache does not serve one client's signature to another.

---

## Where it fits

For server-to-server APIs and webhooks, RFC 9421 is the format to adopt instead of inventing another HMAC-over-a-string scheme. The [request signing guide](/guides/request-signing) covers the design choices, and the [webhook signatures guide](/guides/webhook-signatures) compares it with the formats webhook providers use today.
