---
title: "JSON Web Token (JWT)"
description: "A technical reference for JSON Web Tokens, covering the header/payload/signature structure, registered claims, JWS versus JWE, signing algorithms, and common validation pitfalls."
currentVersion: "RFC 7519"
officialUrl: "https://www.rfc-editor.org/rfc/rfc7519"
---

## What is a JWT?

A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims are encoded as a JSON object that is either digitally signed (as a JWS) or encrypted (as a JWE). JWTs are the de facto format for bearer credentials in modern APIs, most notably as OAuth 2.0 access tokens and OpenID Connect ID Tokens.

A signed JWT is three Base64URL-encoded segments joined by dots:
```
header.payload.signature
```

---

## 1. Structure

A JWT is a claims set serialized into either a JWS (signed) or a JWE (encrypted) structure. The signed form — by far the most common for API credentials — consists of a JOSE header, a payload of claims, and a signature. (A JWE has five segments instead: protected header, encrypted key, initialization vector, ciphertext, and authentication tag.)

### Header (JOSE Header)
Describes the token type and the cryptographic algorithm:
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2024-06-key"
}
```
The `kid` (key ID) helps the verifier select the correct public key, often from a JWKS endpoint.

### Payload (Claims Set)
```json
{
  "iss": "https://auth.example.com",
  "sub": "user-12345",
  "aud": "https://api.example.com",
  "exp": 1735689600,
  "nbf": 1735686000,
  "iat": 1735686000,
  "jti": "id-98a7b6"
}
```

### Signature
Computed over `base64url(header) + "." + base64url(payload)` using the algorithm named in `alg`, then Base64URL-encoded.

---

## 2. Registered Claims

RFC 7519 reserves a set of claim names. All are optional but carry defined semantics:

| Claim | Name            | Meaning                                                        |
|-------|-----------------|---------------------------------------------------------------|
| `iss` | Issuer          | Principal that issued the token.                               |
| `sub` | Subject         | Principal the token is about (typically a user ID).           |
| `aud` | Audience        | Recipient(s) the token is intended for.                       |
| `exp` | Expiration Time | Numeric date after which the token must be rejected.          |
| `nbf` | Not Before      | Numeric date before which the token must not be accepted.     |
| `iat` | Issued At       | Numeric date the token was issued.                            |
| `jti` | JWT ID          | Unique identifier, useful for replay prevention/revocation.   |

Time-based claims are NumericDate values — seconds since the Unix epoch.

---

## 3. JWS vs JWE

JWT is a claims format; the actual protection comes from JWS or JWE.

| Aspect        | JWS (Signed)                     | JWE (Encrypted)                        |
|---------------|----------------------------------|----------------------------------------|
| Spec          | RFC 7515                         | RFC 7516                               |
| Guarantee     | Integrity + authenticity         | Confidentiality (+ integrity)          |
| Payload       | Readable (Base64URL, not secret) | Ciphertext, opaque to the client       |
| Segments      | 3                                | 5                                      |
| Typical use   | Access/ID tokens                 | Tokens carrying sensitive data         |

A critical point: a signed JWT is **not** encrypted. Anyone can Base64URL-decode the payload and read the claims. Never place secrets in a JWS payload.

---

## 4. Signing Algorithms

The `alg` header value selects the algorithm, defined in RFC 7518 (JWA):

* **HS256** — HMAC with SHA-256. Symmetric: the same secret signs and verifies. Simple, but the secret must be shared with every verifier.
* **RS256** — RSASSA-PKCS1-v1_5 with SHA-256. Asymmetric: a private key signs, and a widely distributable public key verifies.
* **ES256** — ECDSA using P-256 and SHA-256. Asymmetric with smaller keys/signatures than RSA.

Asymmetric algorithms (RS256, ES256) are preferred for distributed systems because resource servers only ever need the public key.

---

## 5. Relation to OAuth Bearer Tokens

JWTs are commonly transported as OAuth 2.0 bearer tokens in the `Authorization` header:
```http
GET /resource HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```
When an access token is a JWT, the resource server can validate it locally by checking the signature and claims, without a network round trip to the authorization server.

---

## 6. Validation Pitfalls

* **`alg: none`.** The `none` algorithm produces an unsigned token. Verifiers must never accept it unless explicitly and intentionally configured to. Always pin the expected algorithm(s).
* **Algorithm confusion.** Do not let the token's own `alg` header dictate the verification key type. An attacker can swap RS256 for HS256 and sign with the (public) RSA key as an HMAC secret. Enforce an allowlist.
* **Expiry and clock skew.** Always validate `exp` (and `nbf` when present). Allow a small leeway (e.g. 60 seconds) for clock differences, not more.
* **Audience.** Validate `aud` matches your service. A token minted for another API must be rejected.
* **Issuer.** Validate `iss` and only trust keys from that issuer's JWKS.
