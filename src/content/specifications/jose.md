---
title: "JOSE: JWS, JWE, JWK and JWA (RFC 7515-7518)"
description: "A reference for the JSON Object Signing and Encryption suite: JWS signatures, JWE encryption and its five-part compact form, JWK keys and key sets, the JWA algorithm registry, the compact and JSON serializations, and the alg pitfalls behind most JWT vulnerabilities."
currentVersion: "RFC 7515, 7516, 7517, 7518"
officialUrl: "https://datatracker.ietf.org/wg/jose/about/"
---

## What is JOSE?

A [JWT](/specifications/jwt) is a claims set. It says nothing about how those claims are protected. That job belongs to JOSE, the JSON Object Signing and Encryption suite published by the IETF in May 2015 as four Proposed Standards that only make sense together:

| RFC | Name | Defines |
| :--- | :--- | :--- |
| RFC 7515 | JSON Web Signature (JWS) | Signing or MACing arbitrary content |
| RFC 7516 | JSON Web Encryption (JWE) | Encrypting arbitrary content |
| RFC 7517 | JSON Web Key (JWK) | Representing keys, and sets of keys, as JSON |
| RFC 7518 | JSON Web Algorithms (JWA) | The algorithm identifiers the other three use |

JWT (RFC 7519) is built on top: every signed JWT is a JWS, and every encrypted JWT is a JWE. If you have debugged a JWT, you have been reading JOSE. The suite is also used directly, without JWT claims, for signed webhook payloads, encrypted documents, and key distribution through JWKS endpoints.

Companion documents worth knowing: RFC 7520 is a book of worked examples, RFC 7638 defines the JWK thumbprint, RFC 8037 adds Ed25519 and X25519 keys, RFC 8725 is the JWT security BCP, and RFC 9864 (October 2025) introduces fully-specified algorithm identifiers.

---

## 1. JWS: Signatures

A JWS has three parts: a protected header, a payload, and a signature computed over both. The compact serialization joins them with dots:

```text
BASE64URL(UTF8(JWS Protected Header)) . BASE64URL(Payload) . BASE64URL(JWS Signature)
```

The signing input is the first two parts exactly as encoded, dot included. Verifiers must check the signature over the bytes they received, never over a re-encoded header or payload.

Common header parameters:

| Parameter | Purpose |
| :--- | :--- |
| `alg` | Algorithm. The only required parameter |
| `kid` | Key identifier, used to pick a key from a set |
| `typ` | Media type of the whole object, for example `JWT` or `dpop+jwt` |
| `cty` | Media type of the payload, used for nested tokens |
| `jku`, `x5u` | URL of a JWK Set or X.509 certificate chain |
| `jwk`, `x5c` | The key or certificate itself, embedded |
| `crit` | Extensions the recipient **MUST** understand, or reject the object |

The payload can be anything. It is usually JSON, but a JWS can sign a binary file just as well.

---

## 2. JWE: Encryption

A JWE encrypts content with a random content encryption key (CEK) and then protects the CEK for the recipient. Two algorithms are always involved: `alg` says how the CEK is delivered, and `enc` says how the content is encrypted with it. The compact serialization has five parts:

```text
BASE64URL(UTF8(JWE Protected Header)) .
BASE64URL(JWE Encrypted Key) .
BASE64URL(JWE Initialization Vector) .
BASE64URL(JWE Ciphertext) .
BASE64URL(JWE Authentication Tag)
```

Every `enc` algorithm is authenticated encryption: the tag covers the ciphertext and the protected header, so tampering with either is detected. With `alg` set to `dir`, a shared symmetric key is used directly as the CEK and the encrypted key part is empty.

JWE gives confidentiality, not proof of who sent the message: anyone holding the recipient's public key can encrypt to it. When you need both, sign first and then encrypt the JWS, setting `cty` to `JWT` on the outer header for a nested JWT. Five dot-separated parts means JWE; three means JWS.

---

## 3. JWK: Keys and Key Sets

A JWK is a key as a JSON object. `kty` is required; the rest depends on the key type.

```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
  "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
  "use": "sig",
  "alg": "ES256",
  "kid": "2026-01-signing"
}
```

| Parameter | Purpose |
| :--- | :--- |
| `kty` | Key type: `EC`, `RSA` and `oct` from RFC 7518, `OKP` from RFC 8037 |
| `use` | Intended use: `sig` or `enc` |
| `key_ops` | Finer-grained permitted operations, such as `verify` |
| `alg` | The algorithm the key is meant for |
| `kid` | Identifier matching the `kid` header of a JWS or JWE |

A JWK Set is an object with a `keys` array. It is what a JWKS endpoint, such as the `jwks_uri` of an [OpenID Connect](/specifications/openid-connect) provider, serves. The media types are `application/jwk+json` and `application/jwk-set+json`.

Publish only public keys. Private parameters (`d` for EC and OKP, `d`, `p`, `q` and friends for RSA, `k` for `oct`) must never appear in a set you serve. For rotation, publish the new key before you start signing with it, and keep the old one in the set until every token it signed has expired.

---

## 4. JWA: Algorithms

RFC 7518 assigns each algorithm an implementation requirement. A `+` means the requirement is expected to strengthen in future, `-` that it is expected to weaken.

### Signature (`alg` in JWS)

| `alg` | Algorithm | Requirement |
| :--- | :--- | :--- |
| `HS256` | HMAC SHA-256 | Required |
| `RS256` | RSASSA-PKCS1-v1_5 SHA-256 | Recommended |
| `ES256` | ECDSA P-256 SHA-256 | Recommended+ |
| `PS256` | RSASSA-PSS SHA-256 | Optional |
| `none` | No signature | Optional |

The 384 and 512 variants of each family are Optional. RSA keys **MUST** be 2048 bits or larger, and HMAC keys at least as long as the hash output. RFC 8037 adds `EdDSA` with Ed25519 and Ed448 keys; RFC 9864 deprecates that polymorphic `EdDSA` identifier in favor of fully-specified `Ed25519` and `Ed448`.

### Key management (`alg` in JWE)

| `alg` | Mechanism | Requirement |
| :--- | :--- | :--- |
| `RSA1_5` | RSAES-PKCS1-v1_5 | Recommended- |
| `RSA-OAEP` | RSAES-OAEP, SHA-1 | Recommended+ |
| `RSA-OAEP-256` | RSAES-OAEP, SHA-256 | Optional |
| `A128KW`, `A256KW` | AES Key Wrap | Recommended |
| `dir` | Shared key used directly | Recommended |
| `ECDH-ES` | Ephemeral-static ECDH | Recommended+ |
| `ECDH-ES+A128KW`, `ECDH-ES+A256KW` | ECDH-ES with key wrap | Recommended |

### Content encryption (`enc`)

| `enc` | Algorithm | Requirement |
| :--- | :--- | :--- |
| `A128CBC-HS256` | AES-CBC with HMAC SHA-256 | Required |
| `A256CBC-HS512` | AES-CBC with HMAC SHA-512 | Required |
| `A128GCM` | AES-GCM 128 | Recommended |
| `A256GCM` | AES-GCM 256 | Recommended |

For new work: sign with `ES256` (or `Ed25519` where your libraries support it), encrypt with `ECDH-ES` or `RSA-OAEP-256` and `A256GCM`. Avoid `RSA1_5`, which has a long history of padding oracle attacks.

---

## 5. Compact and JSON Serialization

Both JWS and JWE have two serializations.

| | Compact | JSON |
| :--- | :--- | :--- |
| Form | Dot-separated base64url string | JSON object |
| Signatures or recipients | Exactly one | One or many |
| Unprotected header | Not possible | Supported |
| URL and header safe | Yes | No |
| Typical use | JWTs, `Authorization` headers, query parameters | Documents with several signers or recipients |

The JSON serialization comes in a general form, with a `signatures` (JWS) or `recipients` (JWE) array, and a flattened form for a single one. JWTs always use compact. Reach for JSON only when you need several signatures or recipients on one payload.

---

## 6. Pitfalls

Nearly every published JWT vulnerability is a JOSE vulnerability: the verifier trusted the header.

* **`alg: none`.** An unsecured JWS has an empty signature. A library that honors the header's `alg` will accept a forged token with `none`. Never accept it; RFC 8725 says libraries should not produce or consume it unless the caller explicitly asks.
* **Algorithm confusion.** If a verifier configured with an RSA public key accepts `HS256`, an attacker can sign with that public key as the HMAC secret. Pin the expected algorithm per key and do not let the token choose.
* **Untrusted key URLs.** `jku` and `x5u` point at keys the token itself nominates. Following them blindly lets an attacker supply the key and opens server-side request forgery. Use keys you configured, or URLs on an allow-list.
* **Embedded `jwk`.** A key in the header proves only that the token was signed by that key, not by anyone you trust. It is correct for [DPoP](/specifications/dpop), where key continuity is the point, and wrong for issuer authentication.
* **`kid` as input.** Treat it as untrusted. Look it up in a map; do not concatenate it into a file path or a query.
* **Missing `typ`.** Different token types signed by the same key can be swapped for each other. Set and check an explicit `typ`, as RFC 8725 recommends for new token types.
