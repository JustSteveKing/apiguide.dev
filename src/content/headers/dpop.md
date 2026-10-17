---
name: "DPoP"
description: "Carries an RFC 9449 proof-of-possession JWT, signed by the client's private key over the method and URI, binding OAuth tokens to that key."
category: "request"
standard: true
relatedCodes: [400, 401]
reference:
  title: "RFC 9449"
  url: https://www.rfc-editor.org/rfc/rfc9449.html
updatedDate: 2026-10-17
---

## What is the DPoP header?

The `DPoP` request header, defined in Section 4.1 of [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html) (OAuth 2.0 Demonstrating Proof of Possession, Standards Track, September 2023), carries a DPoP proof: a JWT the client signs with a private key it holds, on every request where it uses or obtains a DPoP-bound token. The authorization server binds the issued access token to the matching public key, so a stolen token is useless without the key.

The value is a single JWT in `token68` syntax. Its JOSE header MUST include `typ` set to `dpop+jwt`, an asymmetric `alg` (never `none` and never a MAC algorithm), and `jwk`, the public key. Its payload MUST include:

| Claim | Meaning |
| :--- | :--- |
| `jti` | Unique identifier for this proof |
| `htm` | HTTP method of the request |
| `htu` | Target URI, without query or fragment |
| `iat` | Creation time |
| `ath` | Base64url SHA-256 hash of the access token, when one is presented |
| `nonce` | The server's latest [`DPoP-Nonce`](/headers/dpop-nonce), when one was provided |

At the token endpoint, the proof asks for a bound token, and the response says `"token_type": "DPoP"`. At a resource server, the token goes in [`Authorization`](/headers/authorization) with the `DPoP` scheme, not `Bearer`, and the proof goes in this header. See [OAuth 2.0](/specifications/oauth2) and [token lifecycle](/guides/token-lifecycle).

## API Usage & Best Practices

* **Check everything Section 4.3 lists.** Exactly one `DPoP` header; a well-formed JWT; `typ` is `dpop+jwt`; `alg` is asymmetric and acceptable; the signature verifies with the embedded `jwk`; `jwk` has no private key; `htm` and `htu` match this request; `nonce` matches if you issued one; `iat` is recent; and at a resource server, `ath` matches the token and the key matches the one the token is bound to. Skipping the binding check turns DPoP back into bearer tokens.
* **Accept proofs only briefly, and track `jti`.** RFC 9449 says servers MUST only accept proofs for a limited time after creation, preferably seconds or minutes. Remembering `jti` values for that window blocks replay outright, where your servers share state.
* **Normalize before comparing `htu`.** The RFC says servers SHOULD apply syntax-based and scheme-based URI normalization first. Behind a proxy, compare against the URI the client used, not the internal one.
* **Reject a bound token sent as `Bearer`.** A resource server that supports both schemes MUST refuse a DPoP-bound token presented with `Bearer`, or a thief can skip the proof by downgrading.
* **Make a new proof for every request, including retries.** A proof is single-use where `jti` is tracked, so replaying the same request with the same proof can fail. RFC 9449 recommends a fresh proof even when retrying idempotent requests.
* **Challenge with `WWW-Authenticate: DPoP`.** Return [`401 Unauthorized`](/status-codes/401) with [`WWW-Authenticate`](/headers/www-authenticate)`: DPoP` and an `algs` parameter listing acceptable algorithms. Use `error="invalid_dpop_proof"` when the proof fails checks, and `error="use_dpop_nonce"` with a `DPoP-Nonce` when you require a nonce.
* **Expose headers to browser clients.** Single-page apps can only read `WWW-Authenticate` and `DPoP-Nonce` across origins if you list them in [`Access-Control-Expose-Headers`](/headers/access-control-expose-headers).
* **It is origin authentication only.** The `DPoP` scheme MUST NOT be used with [`Proxy-Authenticate`](/headers/proxy-authenticate) or [`Proxy-Authorization`](/headers/proxy-authorization).
* **Prefer it to bearer tokens where clients can hold a key.** DPoP works at the application layer, so it fits public clients such as browser and mobile apps that cannot do [mutual TLS](/guides/mutual-tls). Where mTLS is available end to end, certificate-bound tokens (RFC 8705) are the alternative.

## Examples

A token request carrying a DPoP proof, from RFC 9449 Figure 5:

```http
POST /token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6Imw4dEZyaHgtMzR0VjNoUklDUkRZOXpDa0RscEJoRjQyVVFVZldWQVdCRnMiLCJ5IjoiOVZFNGpmX09rX282NHpiVFRsY3VOSmFqSG10NnY5VERWclUwQ2R2R1JEQSIsImNydiI6IlAtMjU2In19.eyJqdGkiOiItQndDM0VTYzZhY2MybFRjIiwiaHRtIjoiUE9TVCIsImh0dSI6Imh0dHBzOi8vc2VydmVyLmV4YW1wbGUuY29tL3Rva2VuIiwiaWF0IjoxNTYyMjYyNjE2fQ.2-GxA6T8lP4vfrg8v-FdWP0A0zdrj8igiMLvqRMUvwnQg4PtFLbdLXiOSsX0x7NVY-FNyJK70nfbV37xRZT3Lg

grant_type=authorization_code&client_id=s6BhdRkqt&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb&code_verifier=bEaL42izcC-o-xBk0K2vuJ6U-y1p9r_wW2dFWIWgjz-
```

Using the bound token at a resource server, from RFC 9449 Figure 13. The proof's `ath` claim is the hash of the token in `Authorization`:

```http
GET /protectedresource HTTP/1.1
Host: resource.example.org
Authorization: DPoP Kz~8mXK1EalYznwH-LC-1fBAo.4Ljp~zsPE_NeO.gxU
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6Imw4dEZyaHgtMzR0VjNoUklDUkRZOXpDa0RscEJoRjQyVVFVZldWQVdCRnMiLCJ5IjoiOVZFNGpmX09rX282NHpiVFRsY3VOSmFqSG10NnY5VERWclUwQ2R2R1JEQSIsImNydiI6IlAtMjU2In19.eyJqdGkiOiJlMWozVl9iS2ljOC1MQUVCIiwiaHRtIjoiR0VUIiwiaHR1IjoiaHR0cHM6Ly9yZXNvdXJjZS5leGFtcGxlLm9yZy9wcm90ZWN0ZWRyZXNvdXJjZSIsImlhdCI6MTU2MjI2MjYxOCwiYXRoIjoiZlVIeU8ycjJaM0RaNTNFc05yV0JiMHhXWG9hTnk1OUlpS0NBcWtzbVFFbyJ9.2oW9RP35yRqzhrtNP86L-Ey71EOptxRimPPToA1plemAgR6pxHF8y6-yqyVnmcw6Fy1dqd-jfxSYoMxhAJpLjA
```

A resource server rejecting a token whose key binding does not match:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: DPoP error="invalid_token", error_description="Invalid DPoP key binding", algs="ES256"
```
