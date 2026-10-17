---
title: "DPoP: Demonstrating Proof of Possession (RFC 9449)"
description: "A reference for RFC 9449, which binds OAuth access and refresh tokens to a client-held key: the DPoP proof JWT and its claims, the DPoP authorization scheme, server-supplied nonces, the cnf jkt binding, and how resource servers validate a proof."
currentVersion: "RFC 9449"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9449.html"
---

## What is DPoP?

An OAuth bearer token is like cash: whoever holds it can spend it. A token that leaks from a log, a compromised proxy or a malicious browser extension can be replayed from anywhere until it expires. RFC 9449, published as a Proposed Standard in September 2023, fixes that at the application layer. The client generates a key pair, proves possession of the private key on every request, and the authorization server binds the tokens it issues to the public key. A stolen token without the private key is useless.

Mutual TLS (RFC 8705) achieves the same binding through client certificates, but it needs end-to-end TLS control and certificate provisioning, which browsers and mobile apps rarely have, and which breaks when a load balancer terminates TLS. DPoP lives entirely in HTTP headers, so it works in single-page apps and behind any proxy. The [OAuth 2.0 Security BCP](/specifications/oauth-security-bcp) recommends sender-constrained tokens, and DPoP is the mechanism most public clients can actually deploy.

---

## 1. The Proof JWT

A DPoP proof is a [JWT](/specifications/jwt) signed with the client's private key and sent in the `DPoP` request header. A fresh proof is created for every request.

### Header

| Parameter | Value |
| :--- | :--- |
| `typ` | `dpop+jwt` |
| `alg` | An asymmetric signature algorithm such as `ES256`. **MUST NOT** be `none` or a MAC algorithm |
| `jwk` | The public key, as a [JWK](/specifications/jose). **MUST NOT** contain the private key |

### Claims

| Claim | Required | Contents |
| :--- | :--- | :--- |
| `jti` | Yes | Unique identifier for this proof, with at least 96 bits of randomness or a v4 UUID |
| `htm` | Yes | The HTTP method of the request, for example `POST` |
| `htu` | Yes | The target URI, without query and fragment |
| `iat` | Yes | Creation time, as a NumericDate |
| `ath` | When an access token is sent | base64url SHA-256 hash of the access token |
| `nonce` | When the server supplied one | The most recent `DPoP-Nonce` value |

Decoded, a proof for a token request looks like this (the key values are illustrative):

```json
{
  "typ": "dpop+jwt",
  "alg": "ES256",
  "jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}
.
{
  "jti": "e1j3V_bKic8-LAEB",
  "htm": "POST",
  "htu": "https://server.example.com/token",
  "iat": 1767225600
}
```

`htm` and `htu` scope the proof to one request, `iat` and `jti` limit replay in time, and `ath` ties the proof to one access token. Together they mean a captured proof cannot be reused against a different endpoint, later, or with a different token.

---

## 2. Getting a Bound Token

The client sends a proof with its token request. The authorization server checks it and binds the issued tokens to the key.

```http
POST /token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6...

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb
&code_verifier=bEaL42izcC-o-xBk0K2vuJ6U-y1p9r_wW2dFWIWgjz-
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "Kz~8mXK1EalYznwH-LC-1fBAo.4Ljp~zsPE_NeO.gxU",
  "token_type": "DPoP",
  "expires_in": 2677,
  "refresh_token": "Q..Zkm29lexi8VnWg2zPW1x-tgGad0Ibc3s3EwM_Ni4-g"
}
```

`token_type` is `DPoP`, not `Bearer`. The binding is recorded as the JWK SHA-256 thumbprint (RFC 7638) of the public key, in a `cnf` claim with a `jkt` member for JWT access tokens, or in the same structure in a token introspection response:

```json
{
  "sub": "someone@example.com",
  "aud": "https://resource.example.org",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" }
}
```

For public clients, the refresh token is bound to the same key, which satisfies RFC 9700's requirement that public-client refresh tokens be sender-constrained or rotated. Confidential clients already authenticate when refreshing, so their refresh tokens are not bound.

The optional `dpop_jkt` authorization request parameter carries the key thumbprint at the start of the authorization code flow, so the authorization server can reject a token request made with any other key. Use it when the authorization code itself might leak.

---

## 3. Calling a Resource Server

The access token goes in the [`Authorization`](/headers/authorization) header with the `DPoP` scheme, and a new proof, carrying `ath`, goes in the `DPoP` header:

```http
GET /protectedresource HTTP/1.1
Host: resource.example.org
Authorization: DPoP Kz~8mXK1EalYznwH-LC-1fBAo.4Ljp~zsPE_NeO.gxU
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6...
```

A resource server that accepts DPoP **MUST** reject a DPoP-bound token presented with the `Bearer` scheme. Otherwise an attacker who steals the token simply downgrades it.

When the request fails, the resource server answers [`401 Unauthorized`](/status-codes/401) with a [`WWW-Authenticate`](/headers/www-authenticate) challenge for the `DPoP` scheme, which should list the algorithms it accepts:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: DPoP error="invalid_dpop_proof", algs="ES256 PS256"
```

| Error | Meaning |
| :--- | :--- |
| `invalid_dpop_proof` | The proof is missing, malformed, or fails a check |
| `use_dpop_nonce` | The server requires a nonce; retry with the one in `DPoP-Nonce` |
| `invalid_token` | The token is invalid, or is not bound to the proof's key |

---

## 4. Validating a Proof

Every server receiving a proof, authorization server or resource server, runs roughly the same checks:

1. Exactly one `DPoP` header, holding one well-formed JWT.
2. `typ` is `dpop+jwt`, `alg` is an asymmetric algorithm you allow, and the signature verifies with the embedded `jwk`.
3. `htm` matches the request method and `htu` matches the request URI, ignoring query and fragment.
4. `iat` is within an acceptable window, and `nonce` matches if you issued one.
5. `jti` has not been seen within that window.
6. If an access token is present: `ath` equals the hash of the token, and the token's `jkt` equals the thumbprint of the proof's `jwk`.

Step 3 is where implementations go wrong behind proxies. Reconstruct the URI the client used, scheme and host included, not the one your application server sees after a reverse proxy rewrote it.

---

## 5. Server-Supplied Nonces

`iat` relies on the client's clock and `jti` tracking needs storage. A server that wants a stronger freshness guarantee can demand a nonce. The authorization server responds with [`400 Bad Request`](/status-codes/400) and error `use_dpop_nonce`; the resource server responds with `401` and `WWW-Authenticate: DPoP error="use_dpop_nonce"`. Either way the nonce arrives in the `DPoP-Nonce` header:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: DPoP error="use_dpop_nonce", error_description="Resource server requires nonce in DPoP proof"
DPoP-Nonce: eyJ7S_zG.eyJH0-Z.HX4w-7v
```

The client retries with the value in the proof's `nonce` claim. A server may send a fresh `DPoP-Nonce` on any response, and the client uses the latest one next time. Clients must handle this retry automatically; it is not an error to surface to the user.

---

## 6. Practical Guidance

* **Keep the private key non-extractable.** In a browser, generate it with WebCrypto and `extractable: false`, and store the `CryptoKey` in IndexedDB. A key that JavaScript can read can be stolen by the same XSS that would steal the token.
* **Use `ES256`.** It is compact, fast and universally supported. Advertise what you accept in `dpop_signing_alg_values_supported` in authorization server metadata.
* **DPoP is not client authentication.** It proves the same key is used across requests, not who the client is. A confidential client still authenticates at the token endpoint.
* **Do not skip `ath`.** Without it, a proof captured alongside one token could be paired with another.
* **Accept a little clock skew** on `iat`, or use nonces, rather than rejecting clients with slightly wrong clocks.
