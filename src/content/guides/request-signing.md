---
title: "Request Signing"
description: "Signing outbound API requests with HMAC, AWS SigV4-style canonical requests, signed headers, body digests, and clock-skew handling."
category: "security"
---

## Introduction to Request Signing

Request signing lets a server prove that an incoming request came from a party holding a shared secret and that its contents were not modified in transit. Unlike a bearer token, which grants access to anyone who holds it, a signature is computed fresh for each request over the method, path, headers, and body — so a captured signature cannot be reused against a different request. This guide covers HMAC signing, AWS SigV4-style canonical requests, the newer RFC 9421 standard, and the practical concerns of body digests, clock skew, and replay protection.

---

## 1. What Signing Provides

Signing guarantees two properties:

* **Authenticity** — the request originated from a party that knows the secret key.
* **Integrity** — the signed components were not altered between signing and verification.

It does **not** provide confidentiality. Anyone observing the wire can still read the request unless it is encrypted. Request signing therefore always runs on top of **HTTPS (TLS 1.2 or higher)**, never as a replacement for it.

Signing is well suited to server-to-server communication, webhook delivery, and high-security endpoints where both ends are controlled. For browser and mobile clients, or public APIs with many third-party integrations, token-based schemes such as OAuth are usually a better fit — see [OAuth & API keys](/guides/oauth-api-keys) and [authentication](/guides/authentication).

---

## 2. HMAC as the Core Primitive

Both AWS SigV4 and RFC 9421's symmetric mode build on **HMAC**. The client computes a keyed hash over a canonical representation of the request; the server reconstructs the same representation and recomputes the hash. Because the secret never leaves either party, an attacker who intercepts the request cannot produce a valid signature for a modified one.

A minimal HMAC signing scheme covers:

* the HTTP method,
* the request path and query string,
* a timestamp,
* a digest of the body (for requests that have one),
* any headers whose integrity matters.

```
canonical_string = METHOD + "\n" + PATH + "\n" + QUERY + "\n" + TIMESTAMP + "\n" + body_sha256
signature        = hex(HMAC-SHA256(secret, canonical_string))
```

Use at least SHA-256. On the server, compare signatures with a **constant-time** function (`hmac.Equal`, `crypto.timingSafeEqual`, `hmac.compare_digest`) to avoid leaking information through timing.

---

## 3. Canonicalization: Why Order Matters

The signer and verifier must produce byte-identical strings from the same logical request, or every signature will fail. HTTP allows headers in any order, query parameters in any order, and variable whitespace — so both sides must **canonicalize** to a deterministic form first.

Canonicalization rules typically:

* lowercase header names and trim surrounding whitespace from values,
* sort headers and query parameters alphabetically,
* URI-encode query keys and values consistently,
* fix an exact separator (usually a newline) between components.

Any divergence — an extra line break, a capitalization difference, a re-encoded space — breaks verification. Keep the canonical form as simple as the scheme allows and avoid adding transformation steps that both ends must replicate exactly.

---

## 4. AWS SigV4-Style Canonical Requests

AWS Signature Version 4 is the most widely referenced canonical-request design. It concatenates a fixed set of components, newline-separated, into a canonical request:

```
CanonicalRequest =
  HTTPRequestMethod + "\n" +
  CanonicalURI + "\n" +
  CanonicalQueryString + "\n" +
  CanonicalHeaders + "\n" +
  SignedHeaders + "\n" +
  HexEncode(SHA256(RequestPayload))
```

* **CanonicalHeaders** — the `Host` header, `Content-Type` if present, and any `x-amz-*` headers, all lowercased, trimmed, and sorted.
* **SignedHeaders** — a semicolon-separated, alphabetically sorted list naming exactly which headers were included above.
* **HashedPayload** — a SHA-256 hash of the body, lowercase hex.

The canonical request is then hashed into a **string to sign** that adds the algorithm, timestamp, and credential scope:

```
StringToSign =
  "AWS4-HMAC-SHA256" + "\n" +
  RequestDateTime + "\n" +
  CredentialScope + "\n" +
  HexEncode(SHA256(CanonicalRequest))
```

The signing key is derived from the secret through a chain of HMAC operations, which scopes the key to a date, region, and service:

```
kDate    = HMAC("AWS4" + secret, Date)
kRegion  = HMAC(kDate, Region)
kService = HMAC(kRegion, Service)
kSigning = HMAC(kService, "aws4_request")
signature = HexEncode(HMAC(kSigning, StringToSign))
```

The result goes in the `Authorization` header. Naming the signed headers explicitly lets the verifier know precisely which parts of the message are protected.

---

## 5. RFC 9421: HTTP Message Signatures

The IETF standardized this space with **RFC 9421 "HTTP Message Signatures"** (Proposed Standard, February 2024). It replaces ad-hoc canonicalization with a defined signature base and two structured header fields:

* `Signature-Input` — lists the **covered components** and metadata (`keyid`, `alg`, `created`, and optionally `nonce` and `expires`).
* `Signature` — carries the signature value.

Covered components can be ordinary headers or **derived components** that abstract away HTTP version differences: `@method`, `@target-uri`, `@authority`, and `@path`. This lets the signer choose exactly which parts to protect, which is important when intermediaries may legitimately modify some headers.

```http
POST /transfers HTTP/1.1
Host: api.apiguide.dev
Content-Digest: sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:
Signature-Input: sig1=("@method" "@path" "content-digest");keyid="key-1";alg="hmac-sha256";created=1700000000
Signature: sig1=:K2qGT5srn2OGbOIDzQ6kYT+ruaycnDAAUpKv+ePFfD0=:
```

RFC 9421 supports HMAC-SHA256, RSA (PKCS1-v1_5 and PSS), ECDSA (P-256, P-384), EdDSA, and JWS algorithms, and permits multiple independent signatures on one message.

---

## 6. Body Digests

For any request with a body — POST, PUT, PATCH — the body must be bound into the signature, or an attacker could swap the payload while leaving the signature valid. The standard approach is to compute a **digest** of the body (typically SHA-256) and include that digest in the signed components rather than hashing the raw body twice.

SigV4 folds the payload hash directly into the canonical request. RFC 9421 works with the `Content-Digest` header, which is covered by the signature. Either way, the verifier recomputes the digest from the received body and confirms it matches the signed value before trusting the payload.

---

## 7. Clock Skew and Replay

A signed request that is captured can be replayed. The primary defense is a **timestamp** included in the signature: the server accepts a request only if its timestamp falls within an acceptable window of the current time.

* A common tolerance is **5 minutes**; tighter windows (down to hundreds of milliseconds, as some gateways allow) reduce the replay window but demand well-synchronized clocks.
* **Clock skew** — drift between client and server clocks — will cause legitimate requests to be rejected if the window is too tight. Synchronize clocks with NTP on both sides.
* Beware retry storms: SDKs that assume authentication failures are clock-skew related may repeatedly retry a request that is actually failing for another reason, degrading performance.

For the highest-security endpoints, add a **nonce** — a unique single-use value per request that the server records and refuses to accept twice. This closes the replay window entirely, even inside the timestamp tolerance, at the cost of server-side state.

---

## 8. A Layered Approach

Request signing is one control in a defense-in-depth strategy, not a complete security model.

| Concern | Mechanism |
| --- | --- |
| Authenticity & integrity | HMAC / RFC 9421 signature |
| Confidentiality | HTTPS (TLS 1.2+) |
| Replay | Signed timestamp + optional nonce |
| Timing attacks | Constant-time signature comparison |
| Authorization | OAuth 2.0 scopes / claims |
| Mutual authentication | mTLS for server-to-server |

Combine signing with a standardized framework, transport encryption, disciplined clock management, and anti-replay protection. For broader guidance see [API security](/guides/api-security), and for signature algorithm details relevant to token-based schemes, [JWT](/specifications/jwt).
