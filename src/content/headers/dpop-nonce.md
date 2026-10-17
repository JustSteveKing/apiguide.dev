---
name: "DPoP-Nonce"
description: "A server-issued nonce the client must put in its next DPoP proofs, limiting how long a proof can be used or pre-generated."
category: "response"
standard: true
relatedCodes: [200, 400, 401]
---

## What is the DPoP-Nonce header?

The `DPoP-Nonce` response header, defined in Sections 8 and 9 of [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html), supplies an opaque nonce that the client must include as the `nonce` claim in the [`DPoP`](/headers/dpop) proofs it sends next. Authorization servers and resource servers can both use it.

Without a server nonce, a proof's freshness rests on its `iat` claim, which the client chooses. Anyone in control of the client, including its legitimate user, can sign proofs dated in the future and use them later from a machine without the key. A nonce the server picks, and changes when it likes, means a proof can only have been made after the server issued that nonce.

The value uses the OAuth `NQCHAR` syntax (`nonce = 1*NQCHAR`). Nonces MUST be unpredictable, and a response MUST NOT carry more than one `DPoP-Nonce` header.

## API Usage & Best Practices

* **Demand a nonce with the right error.** An authorization server that requires one answers a token request without it with [`400 Bad Request`](/status-codes/400) and `"error": "use_dpop_nonce"` in the body. A resource server uses [`401 Unauthorized`](/status-codes/401) with [`WWW-Authenticate`](/headers/www-authenticate)`: DPoP error="use_dpop_nonce"`. Both include `DPoP-Nonce`, and the client retries with the nonce in a new proof.
* **Rotate it on successful responses too.** Sending the next nonce in a [`200 OK`](/status-codes/200) response lets the client use it on the following request without an extra round trip. RFC 9449 calls this the more efficient way to supply a new nonce.
* **Keep a window of recent nonces.** The design is that clients keep one nonce and servers accept a small set of recent ones, so concurrent requests and slow networks do not cause failures. A mismatch is self-correcting: reject it and send the current nonce.
* **Encode time into it if clocks are a problem.** RFC 9449 notes that a nonce containing the server's own time lets you bound proof lifetimes even when client clocks are badly skewed.
* **Do not cache responses that carry it.** RFC 9449 says such responses should be uncacheable, for example with `Cache-Control: no-store`, so a stale nonce is not served to the next client.
* **Nonces belong to the server that issued them.** An authorization server nonce is not valid at a resource server, or the other way round. Clients must keep one per server. Do not confuse it with the OpenID Connect ID Token `nonce`.
* **Expose it to browsers.** A single-page app can only read it across origins if you list `DPoP-Nonce` in [`Access-Control-Expose-Headers`](/headers/access-control-expose-headers).

## Examples

An authorization server requiring a nonce, adapted from RFC 9449 Figure 20:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
DPoP-Nonce: eyJ7S_zG.eyJH0-Z.HX4w-7v

{
  "error": "use_dpop_nonce",
  "error_description": "Authorization server requires nonce in DPoP proof"
}
```

A resource server doing the same, from RFC 9449 Figure 24:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: DPoP error="use_dpop_nonce", error_description="Resource server requires nonce in DPoP proof"
DPoP-Nonce: eyJ7S_zG.eyJH0-Z.HX4w-7v
```

Supplying the next nonce on a successful response, from RFC 9449 Figure 23:

```http
HTTP/1.1 200 OK
Cache-Control: no-store
DPoP-Nonce: eyJ7S_zG.eyJbYu3.xQmBj-1
```
