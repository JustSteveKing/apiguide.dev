---
title: "Token Lifecycle: Rotation, Refresh & Revocation"
description: "Managing the full life of API tokens: short-lived access tokens, single-use refresh token rotation, revocation, introspection, and JWKS key rotation."
category: "security"
---

## Introduction to Token Lifecycle

A token grants access, so its greatest risk is the window between issuance and expiry — the period during which a stolen token works. Effective lifecycle management shrinks that window and adds ways to detect and cut off compromise. This guide covers the dual-token model, single-use refresh token rotation, revocation and introspection for immediate invalidation, and JWKS-based signing-key rotation, plus the sender-constraining protections that make token theft harder to exploit.

---

## 1. Access and Refresh Tokens

Modern API security rests on a dual-token strategy defined by OAuth 2.0 (RFC 6749):

* **Access tokens** are short-lived credentials presented on every request to a protected resource. Recommended lifetimes are short — roughly **5 to 60 minutes**, with 5-15 minutes preferred for sensitive systems and a 24-hour ceiling for single-page apps.
* **Refresh tokens** are longer-lived credentials whose only job is to obtain new access tokens without forcing the user to re-authenticate. Sensitive applications typically cap these at **7 to 30 days**.

The separation limits damage: a stolen access token is useless once it expires minutes later, while the refresh token stays protected server-side. RFC 9700 (January 2025) provides updated guidance on choosing these lifetimes.

Access tokens are frequently **JSON Web Tokens** (JWT, RFC 7519), carrying claims such as `exp` (expiration), `iat` (issued-at), and `jti` (a unique ID that helps prevent replay). See [JWT](/specifications/jwt) for the token format itself.

---

## 2. Why Short Lifetimes Matter

A stolen token bypasses the authentication that issued it. Once an attacker holds a valid access token, no amount of MFA or SSO on the login flow helps — the token itself is proof of authentication. A 60-minute access token grants 60 minutes of unrestricted access.

Refresh tokens are more dangerous still: a stolen one can silently mint fresh access tokens for as long as it remains valid, sustaining access for days or weeks. Refresh tokens also operate independently of SSO and MFA on every subsequent use, which is why long-lived, broadly-scoped refresh tokens are a recurring source of large breaches. The remedy is to keep access tokens short and refresh tokens both time-limited and rotated.

---

## 3. Refresh Token Rotation

**Refresh token rotation** makes every refresh token **single-use**. When a client redeems a refresh token, the authorization server does two things at once:

1. issues a new access token **and** a new refresh token, and
2. immediately invalidates the refresh token that was just used.

```http
POST /oauth/token HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=rt_9f3c...&client_id=app_42
```

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "rt_a71d...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

This turns a stolen refresh token from a silent backdoor into a detectable event. If an attacker uses a stolen token, the legitimate client's next refresh — with the now-invalidated old token — fails, signaling compromise.

### Reuse Detection

Rotation is far stronger when paired with **reuse detection**. If an already-used (invalidated) refresh token is presented again, the server treats it as evidence of theft and revokes the entire **token family** descended from the original grant. A refresh token replay is one of the clearest signals of compromise available, precisely because a well-behaved client never reuses one.

---

## 4. Revocation

Short lifetimes and rotation still leave moments where immediate invalidation is required — a logout, a credential change, or a detected compromise.

For **opaque tokens** (validated server-side), RFC 7009 defines a dedicated revocation endpoint. The client POSTs the token; the server invalidates it and returns HTTP 200 whether or not the token was already inactive.

```http
POST /oauth/revoke HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/x-www-form-urlencoded

token=rt_a71d...&token_type_hint=refresh_token
```

**JWTs are harder to revoke.** Because a resource server validates a JWT locally from its claims, it will accept a valid-looking JWT until `exp` without ever contacting the authorization server. To honor revocation before expiry you need an extra mechanism:

* push revocation state to resource servers, or
* adopt the **phantom token pattern**, where an API gateway exchanges an opaque external token for a short-lived internal JWT and enforces revocation centrally at the gateway.

Revoking a refresh token revokes the whole delegation, invalidating the access tokens issued under it. Keeping JWT access-token lifetimes short is itself a practical revocation strategy — the token expires before a revocation list would matter.

---

## 5. Token Introspection

**Token introspection** (RFC 7662) lets a resource server ask the authorization server, in real time, whether a token is still valid and what it authorizes. The endpoint returns an `active` boolean plus claims such as `scope`, `client_id`, and `exp`.

```json
{
  "active": true,
  "scope": "orders:read orders:write",
  "client_id": "app_42",
  "exp": 1700003600,
  "sub": "user_918"
}
```

Introspection is the right tool when local validation is not enough:

* opaque tokens that cannot be validated without the authorization server,
* sensitive operations (financial, health, personal data) that must confirm validity on every request,
* environments needing **immediate** revocation enforcement,
* microservice or agent architectures wanting uniform, centralized validation.

The trade-off is a network round trip per check, adding latency. Many systems reserve introspection for high-value operations and rely on short-lived local JWT validation elsewhere.

---

## 6. Key Rotation with JWKS

Self-contained JWTs are trusted because their signatures verify against the issuer's public key. Those signing keys must themselves be rotated, and **JSON Web Key Sets (JWKS)** make this possible without redeploying code.

A JWKS is a JSON document — a `keys` array of public keys — published at a well-known endpoint, commonly `/.well-known/jwks.json` (often discovered via `jwks_uri` in an OIDC discovery document). Each JWT header carries a `kid` (key ID) so verifiers select the right key.

Zero-downtime rotation follows a phased overlap:

1. Generate a new key pair; add the new public key to the JWKS with a new `kid`, keeping the old key published.
2. Start signing new tokens with the new private key. Verifiers fetch the updated JWKS and match by `kid`.
3. Wait out a grace period until all tokens signed with the old key have expired.
4. Remove the old public key from the JWKS.

Because both keys are published during the transition, verifiers accept tokens signed with either — no service disruption. Cache the JWKS with a short TTL (10-15 minutes), refresh on verification failure, and warm the cache on startup. For signing, EdDSA and ES256 are preferred over RS256; symmetric HS256 is discouraged for multi-party verification.

---

## 7. Sender-Constrained Tokens

The protections above limit and detect theft; sender-constraining makes a stolen token unusable by anyone but the legitimate client. A bearer token works for whoever holds it — binding the token to a key or certificate breaks that.

* **DPoP** (Demonstrating Proof of Possession, RFC 9449) requires the client to cryptographically prove, on every request, that it holds a private key associated with the token.
* **Mutual TLS (mTLS)** binds the token to the client's TLS certificate, so only that client can present it.

Either mechanism means an intercepted token alone is insufficient — the attacker would also need the bound key or certificate.

---

## 8. PKCE and Behavioral Monitoring

**Proof Key for Code Exchange (PKCE, RFC 7636)** prevents authorization-code interception, a common precursor to token theft, by requiring a secret `code_verifier` at the token-exchange step that only the legitimate client holds. Once an extension for public clients, PKCE is **mandatory for all client types in OAuth 2.1**, which also removes the implicit and password grants and forbids bearer tokens in URLs.

No cryptographic control detects a token being *actively abused* once stolen. **Behavioral monitoring** fills that gap: establish baselines for normal token use and flag deviations such as impossible travel (use from distant locations in an unrealistic timeframe), abnormal request volumes, or unexpected network origins. This is often the only signal that catches a compromised token that otherwise passes every validation check.

---

## 9. Common Pitfalls

| Pitfall | Consequence |
| --- | --- |
| Long-lived access tokens | Extends the window a stolen token stays useful. |
| No refresh token rotation | A leaked refresh token grants indefinite access. |
| Rotation without reuse detection | Loses the clearest signal of token theft. |
| Improper client-side token storage | Tokens exfiltrated from insecure storage. |
| Broad, long-lived refresh tokens for integrations | One vendor breach cascades across many customers. |
| Assuming MFA/SSO protects issued tokens | A stolen token bypasses both entirely. |

A resilient token system layers short-lived access tokens, single-use rotating refresh tokens, prompt revocation or introspection, regular JWKS key rotation, sender-constraining, and behavioral monitoring. For the broader security context, see [API security](/guides/api-security), [authentication](/guides/authentication), and [OAuth & API keys](/guides/oauth-api-keys).
