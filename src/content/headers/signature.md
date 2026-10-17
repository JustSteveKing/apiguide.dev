---
name: "Signature"
description: "Carries one or more RFC 9421 HTTP Message Signature values, each keyed by the label that matches its entry in Signature-Input."
category: "both"
standard: true
relatedCodes: [400, 401]
reference:
  title: "RFC 9421, Section 4.2"
  url: https://www.rfc-editor.org/rfc/rfc9421.html#section-4.2
updatedDate: 2026-10-14
---

## What is the Signature header?

The `Signature` header, defined in Section 4.2 of [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) (HTTP Message Signatures, Standards Track, February 2024), carries the output of signing an HTTP request or response. It is a Dictionary [Structured Field](/specifications/structured-fields): each member's key is a label, and its value is a Byte Sequence, which is base64 wrapped in colons.

```http
Signature: sig1=:pxcQw6G3AjtMBQjwo8XzkZf/bws5LelbaMk5rGIGtE8=:
```

On its own the value means nothing. What was signed, with which key and when, is declared under the same label in [`Signature-Input`](/headers/signature-input). RFC 9421 requires every message signature to use both headers with the same labels, and treats a label present in one but not the other as an error.

A message can carry several signatures at once, from one signer using different keys or algorithms, or from different parties. Each needs a unique label, and they can share one header or be split across several.

The algorithms registered by RFC 9421 are:

| `alg` value | Algorithm |
| :--- | :--- |
| `rsa-pss-sha512` | RSASSA-PSS using SHA-512 |
| `rsa-v1_5-sha256` | RSASSA-PKCS1-v1_5 using SHA-256 |
| `hmac-sha256` | HMAC using SHA-256 (shared secret) |
| `ecdsa-p256-sha256` | ECDSA, curve P-256, SHA-256 |
| `ecdsa-p384-sha384` | ECDSA, curve P-384, SHA-384 |
| `ed25519` | EdDSA using curve edwards25519 |

JWS algorithms from the JOSE registry can also be used, identified through the key rather than through `alg`.

## API Usage & Best Practices

* **Prefer an asymmetric algorithm, and default to `ed25519`.** It is fast, has small keys and signatures, and is deterministic, so a test vector produces the same bytes every time. Use `hmac-sha256` only when both ends are yours: anyone who can verify an HMAC signature can also forge one, so it proves nothing to a third party. See [webhook signatures](/guides/webhook-signatures) for why that matters once a payload is archived.
* **Verify the signature, then the digest, then the age.** A signature covering `content-digest` only proves the header was not changed. Recompute the [`Content-Digest`](/headers/content-digest) over the body you actually received, compare it, and check `created` against your maximum age. Skipping any of the three makes the other two decorative.
* **Require the signatures your profile names, and tolerate the rest.** If your profile says every request carries a signature from a known key covering a stated set of components, reject a request that has none. Labels are chosen by the signer, so match on key and coverage, not on the label name. Extra signatures from intermediaries are legitimate and should not cause a failure.
* **Do not sign over another `Signature`.** Section 7.3.7 calls covering an existing signature value NOT RECOMMENDED because of known weaknesses. A proxy that validates a client signature should add its own signature over the components it vouches for, as in the example below.
* **Do not confuse it with the older Cavage format.** The pre-RFC `draft-cavage-http-signatures` used a `Signature` header with `keyId=`, `algorithm=`, `headers=` and `signature=` parameters, and that format is still common in ActivityPub software. It is not RFC 9421 and the two are not interoperable. If you see a comma-separated list of `name="value"` pairs instead of a `label=:base64:` dictionary, it is Cavage.
* **Return `401` with a problem body when verification fails.** RFC 9421 defines no status code. [`401 Unauthorized`](/status-codes/401) suits a missing or invalid signature that stands in for authentication, and [`400 Bad Request`](/status-codes/400) a header that does not parse. Say which check failed, but not which byte.
* **Use it on top of TLS, not instead of it.** Signatures give integrity and authenticity, never confidentiality. See [request signing](/guides/request-signing) and [HTTP Message Signatures](/specifications/http-message-signatures).

## Examples

HMAC-signed request, from the RFC 9421 Appendix B.2.5 test vector. The shared secret is the one published in Appendix B.1.5, so you can check an implementation against it:

```http
POST /foo?param=Value&Pet=dog HTTP/1.1
Host: example.com
Date: Tue, 20 Apr 2021 02:07:55 GMT
Content-Type: application/json
Content-Length: 18
Signature-Input: sig-b25=("date" "@authority" "content-type");created=1618884473;keyid="test-shared-secret"
Signature: sig-b25=:pxcQw6G3AjtMBQjwo8XzkZf/bws5LelbaMk5rGIGtE8=:

{"hello": "world"}
```

Two signatures on one message, from RFC 9421 Section 4.3: the client's original under `sig1`, and a reverse proxy's under `proxy_sig`. The proxy has rewritten `Host`, so the client's signature no longer verifies at the origin; the proxy's signature covers the new authority and the [`Forwarded`](/headers/forwarded) header it added, and expires a minute after creation:

```http
POST /foo?param=Value&Pet=dog HTTP/1.1
Host: origin.host.internal.example
Date: Tue, 20 Apr 2021 02:07:56 GMT
Content-Type: application/json
Content-Length: 18
Forwarded: for=192.0.2.123;host=example.com;proto=https
Content-Digest: sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:
Signature-Input: sig1=("@method" "@authority" "@path" "content-digest" "content-type" "content-length");created=1618884475;keyid="test-key-ecc-p256", proxy_sig=("@method" "@authority" "@path" "content-digest" "content-type" "content-length" "forwarded");created=1618884480;keyid="test-key-rsa";alg="rsa-v1_5-sha256";expires=1618884540
Signature: sig1=:X5spyd6CFnAG5QnDyHfqoSNICd+BUP4LYMz2Q0JXlb//4Ijpzp+kve2w4NIyqeAuM7jTDX+sNalzA8ESSaHD3A==:, proxy_sig=:S6ZzPXSdAMOPjN/6KXfXWNO/f7V6cHm7BXYUh3YD/fRad4BCaRZxP+JH+8XY1I6+8Cy+CM5g92iHgxtRPz+MjniOaYmdkDcnL9cCpXJleXsOckpURl49GwiyUpZ10KHgOEe11sx3G2gxI8S0jnxQB+Pu68U9vVcasqOWAEObtNKKZd8tSFu7LB5YAv0RAGhB8tmpv7sFnIm9y+7X5kXQfi8NMaZaA8i2ZHwpBdg7a6CMfwnnrtflzvZdXAsD3LH2TwevU+/PBPv0B6NMNk93wUs/vfJvye+YuI87HU38lZHowtznbLVdp770I6VHR6WfgS9ddzirrswsE1w5o0LV/g==:

{"hello": "world"}
```
