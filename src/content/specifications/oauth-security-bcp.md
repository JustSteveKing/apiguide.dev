---
title: "OAuth 2.0 Security Best Current Practice (RFC 9700)"
description: "A reference for RFC 9700 (BCP 240), the IETF's current security baseline for OAuth 2.0: exact redirect URI matching, mandatory PKCE, the end of the implicit and password grants, sender-constrained tokens, refresh token rotation and mix-up defenses."
currentVersion: "RFC 9700 (BCP 240)"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9700.html"
---

## What is the OAuth 2.0 Security BCP?

RFC 6749 was published in 2012. In the decade that followed, attackers found ways around almost every optional or loosely worded part of it: redirect URIs matched by prefix, authorization codes intercepted on mobile devices, tokens leaked through browser history and referrers, clients confused about which authorization server they were talking to. Each fix arrived as a separate RFC or a blog post, and a team implementing [OAuth 2.0](/specifications/oauth2) from the core specification alone would ship most of those holes.

RFC 9700, published in January 2025 as BCP 240, collects the fixes into one document. It updates RFC 6749, RFC 6750 and the original threat model in RFC 6819. Section 2 is the part to read: a short list of normative recommendations. The rest of the document is the attack catalogue that justifies them.

Treat it as the minimum for any new OAuth deployment, whether you run the authorization server or only a client or resource server. OAuth 2.1, still an Internet-Draft, folds most of these requirements into the core protocol; implementing RFC 9700 today gets you most of the way there.

---

## 1. The Requirements at a Glance

| Area | RFC 9700 says |
| :--- | :--- |
| Redirect URIs | Authorization servers **MUST** use exact string matching, except for the port in `localhost` redirect URIs used by native apps |
| PKCE | Public clients **MUST** use PKCE; it is **RECOMMENDED** for confidential clients. Authorization servers **MUST** support it |
| Authorization codes | **MUST** be invalidated after first use |
| Implicit grant | Clients **SHOULD NOT** use `response_type=token` unless token injection and leakage are mitigated |
| Password grant | The resource owner password credentials grant **MUST NOT** be used |
| Access tokens | **SHOULD** be sender-constrained and audience-restricted |
| Refresh tokens | For public clients, **MUST** be sender-constrained or rotated |
| Client authentication | **SHOULD** be enforced where feasible; asymmetric methods are **RECOMMENDED** |
| Mix-up | Clients talking to more than one authorization server need a defense; the `iss` response parameter (RFC 9207) is the recommended one |
| Transport | Authorization responses **MUST NOT** be sent over unencrypted connections |
| CORS | **MUST NOT** be supported at the authorization endpoint |

---

## 2. Redirect-Based Flows

### Exact redirect URI matching

Pattern and prefix matching was the root of a whole family of token theft attacks. If the registered URI is `https://app.example.com/callback` and the server accepts anything under `https://app.example.com/`, an attacker who finds one open redirector or one page with user-controlled content on that host can receive the code. Compare the full string. The one exception is native apps listening on a loopback interface, where the port is chosen at runtime.

Clients and authorization servers **MUST NOT** expose open redirectors: endpoints that forward the browser to an arbitrary URI taken from a parameter.

### PKCE everywhere

PKCE (RFC 7636) binds the authorization code to a secret the client generated, so a stolen code is useless without it. RFC 9700 makes it mandatory for public clients and recommended for confidential ones, and it also defends against CSRF and code injection. Use the `S256` challenge method. The authorization server **MUST** enforce `code_verifier` whenever a `code_challenge` was sent, and must stop a downgrade where an attacker strips the challenge from the request.

### CSRF and mix-up

Clients **MUST** prevent CSRF on the redirect endpoint. PKCE does this, as does the OpenID Connect `nonce` or a one-time `state` value bound to the user agent. A client that works with several authorization servers must also defend against mix-up attacks, where a malicious server tricks the client into sending another server's code to it. Check the `iss` parameter in the authorization response against the server you started the flow with.

### Drop implicit and password grants

The implicit grant returns the access token in the URL fragment, where it can leak and cannot be sender-constrained. Use the authorization code grant with PKCE instead, including in single-page applications. The password grant teaches users to type credentials into third-party apps and cannot support multi-factor authentication or federated login. RFC 9700 does not deprecate it; it prohibits it.

---

## 3. Token Replay and Privilege

### Sender-constrained tokens

A bearer token works for whoever holds it. RFC 9700 recommends binding access tokens to a key the client holds, so a leaked token cannot be replayed by someone else. Two mechanisms are standardized:

| Mechanism | How the key is proved | Fits best |
| :--- | :--- | :--- |
| Mutual TLS (RFC 8705) | Client certificate in the TLS handshake | Server-to-server, where you control TLS termination |
| [DPoP](/specifications/dpop) (RFC 9449) | A signed JWT in the `DPoP` header of each request | Browsers, mobile apps, anywhere TLS terminates before your code |

See [mutual TLS](/guides/mutual-tls) for the first. If you are choosing for a new public API, DPoP is usually the easier one to deploy, because it survives load balancers and CDNs that terminate TLS.

### Refresh tokens

Refresh tokens for public clients **MUST** be sender-constrained or rotated. With rotation, every refresh returns a new refresh token and invalidates the old one. If an old token is presented again, either the client or an attacker has a copy, and the server should revoke the whole grant. Refresh tokens should also expire after a period of inactivity. The [token lifecycle](/guides/token-lifecycle) guide covers rotation in practice.

### Audience and scope

Restrict each access token to the resource server that will consume it, through the `aud` claim in a [JWT](/specifications/jwt) access token or the `resource` parameter (RFC 8707). A token valid everywhere is a token that one compromised service can replay against every other. Issue the minimum scope the operation needs.

---

## 4. Client Authentication

Authorization servers **SHOULD** authenticate clients wherever feasible, and RFC 9700 recommends asymmetric methods: mutual TLS or `private_key_jwt`, where the client signs an assertion with a private key. The server then stores only public keys, so a breach of the authorization server does not leak client secrets.

A shared `client_secret` still works and is still common. If you use one, generate it with enough entropy, never embed it in a mobile or browser app (that is a public client and should not have one), and support rotation.

---

## 5. Authorization Server Hardening

* **Publish metadata.** Serve Authorization Server Metadata (RFC 8414) so clients discover endpoints and supported features rather than hardcoding them.
* **Prevent clickjacking.** The authorization and login pages **MUST** resist framing. Send `Content-Security-Policy: frame-ancestors` and combine it with `X-Frame-Options` for older browsers.
* **Beware 307.** Redirecting a credential-carrying `POST` with a [`307 Temporary Redirect`](/status-codes/307) makes the browser resend the form, password included, to the client. Use [`303 See Other`](/status-codes/303).
* **No CORS at the authorization endpoint.** It is navigated to, never fetched.
* **Do not let clients pick identifiers that look like users.** If a client can register a `client_id` equal to some user's `sub`, a client credentials token can be mistaken for a user's token.

---

## 6. What It Means for an API

If you run a resource server rather than an authorization server, most of RFC 9700 is somebody else's problem, but four parts are yours:

1. Validate the audience. Reject tokens not issued for your API.
2. Accept tokens only in the [`Authorization`](/headers/authorization) header, never in a query string.
3. Support DPoP or mTLS bound tokens if your authorization server issues them, and reject a bound token presented as `Bearer`.
4. Enforce scope per operation, and return [`403 Forbidden`](/status-codes/403) with `insufficient_scope` rather than [`401 Unauthorized`](/status-codes/401) when the token is valid but too weak.

For the broader picture of picking between OAuth, API keys and other schemes see [authentication](/guides/authentication) and [OAuth and API keys](/guides/oauth-api-keys). For identity on top of OAuth see [OpenID Connect](/specifications/openid-connect).
