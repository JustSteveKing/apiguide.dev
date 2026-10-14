---
title: "OAuth 2.0 and OAuth 2.1"
description: "A reference for the OAuth 2.0 authorization framework (RFC 6749, RFC 6750) and the OAuth 2.1 draft, covering roles, grant types, PKCE, the RFC 9700 security BCP, token revocation and introspection, and server metadata."
currentVersion: "RFC 6749 (OAuth 2.1 in draft)"
officialUrl: "https://www.rfc-editor.org/rfc/rfc6749.html"
---

## What is OAuth 2.0?

OAuth 2.0 is a delegation framework. It lets a client application obtain limited access to an HTTP API on behalf of a resource owner (usually a user), or on its own behalf, without ever handling the owner's password. The client receives an **access token** scoped to what was granted, and presents it to the API.

OAuth 2.0 is authorization, not authentication. An access token says what the bearer may do, not who the user is. If you need identity, use [OpenID Connect](/specifications/openid-connect), which adds an ID Token on top of the same flows.

The core is two RFCs: **RFC 6749** (the framework) and **RFC 6750** (bearer token usage). A decade of extensions and security fixes sit around them, and **OAuth 2.1** consolidates the parts that survived into one document. OAuth 2.1 is still an Internet-Draft (`draft-ietf-oauth-v2-1`, revision 16 at the time of writing), not an RFC, so cite RFC 6749 plus RFC 9700 when you need a published standard.

---

## 1. Roles and Endpoints

| Role | Responsibility |
| --- | --- |
| **Resource owner** | The entity that can grant access, typically the end user |
| **Client** | The application requesting access. *Confidential* clients can keep a secret; *public* clients (SPAs, mobile and desktop apps) cannot |
| **Authorization server** | Authenticates the owner, obtains consent, and issues tokens |
| **Resource server** | The API, which accepts and validates access tokens |

The authorization server exposes an **authorization endpoint** (browser redirects) and a **token endpoint** (back-channel `POST` requests). Token responses carry `Cache-Control: no-store` so no intermediary keeps a copy.

---

## 2. Grant Types

| Grant | RFC 6749 | OAuth 2.1 | Use it for |
| --- | --- | --- | --- |
| Authorization code (with PKCE) | Yes | Yes | Any client acting for a user |
| Client credentials | Yes | Yes | Service-to-service calls with no user |
| Refresh token | Yes | Yes | Renewing access without re-prompting the user |
| Implicit (`response_type=token`) | Yes | Removed | Nothing. Use authorization code with PKCE |
| Resource owner password credentials | Yes | Removed | Nothing. The client sees the password, which defeats the point |

The device authorization grant (RFC 8628) covers input-constrained devices such as TVs and CLIs. For choosing between client credentials and user-delegated flows in practice, see [OAuth 2.0 & API Keys](/guides/oauth-api-keys).

---

## 3. Authorization Code with PKCE

PKCE (RFC 7636) binds the authorization request to the token request. The client generates a random `code_verifier`, sends its SHA-256 hash as the `code_challenge`, and later proves possession by sending the verifier itself. An attacker who intercepts the code cannot redeem it.

```http
GET /authorize?response_type=code
    &client_id=s6BhdRkqt3
    &redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb
    &scope=orders%3Aread
    &state=xyz123
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256 HTTP/1.1
Host: auth.example.com
```

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb
&client_id=s6BhdRkqt3
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "2YotnFZFEjr1zKboUfz2xA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "orders:read"
}
```

Always use `S256`. The `plain` method sends the verifier as the challenge and protects nothing if the authorization request leaks.

---

## 4. Using Bearer Tokens

RFC 6750 defines three ways to send a bearer token; only the [`Authorization`](/headers/authorization) header is worth using. A token in a query string ends up in server logs, browser history and `Referer` headers, and RFC 9700 forbids it outright.

```http
GET /v1/orders HTTP/1.1
Host: api.example.com
Authorization: Bearer 2YotnFZFEjr1zKboUfz2xA
```

When a token is rejected, the resource server responds with a [`WWW-Authenticate`](/headers/www-authenticate) challenge and the status RFC 6750 assigns to each error code:

| `error` | Status | Meaning |
| --- | --- | --- |
| `invalid_request` | [`400 Bad Request`](/status-codes/400) | Malformed request, missing or duplicated parameters |
| `invalid_token` | [`401 Unauthorized`](/status-codes/401) | Expired, revoked, malformed or otherwise invalid token |
| `insufficient_scope` | [`403 Forbidden`](/status-codes/403) | Valid token without the required scope |

Access tokens are often [JWTs](/specifications/jwt) so resource servers can validate them locally, but RFC 6749 does not require any format. Clients should treat them as opaque strings and never parse them.

---

## 5. The Security BCP (RFC 9700)

RFC 9700 (BCP 240, January 2025) updates RFC 6749 and RFC 6750 with what a decade of attacks taught. Its core requirements, most of which OAuth 2.1 adopts:

* Authorization servers **must** compare redirect URIs by exact string match (only the port may vary for native-app loopback redirects).
* Public clients **must** use PKCE; it is recommended for confidential clients too, and authorization servers must support it.
* Clients **should not** use the implicit grant, and the password grant **must not** be used.
* Access tokens **must not** be passed in a URI query parameter.
* Refresh tokens for public clients **must** be sender-constrained or rotated on every use.
* Access tokens **should** be audience-restricted to one resource server, and sender-constrained with mutual TLS (RFC 8705) or DPoP (RFC 9449) where possible.

Treat RFC 9700 as the baseline for any new deployment. "Supports OAuth 2.0" without it describes a server vulnerable to attacks that have been public for years.

---

## 6. Revocation, Introspection and Metadata

Three extensions turn the framework into something operable:

| Spec | Endpoint | Purpose |
| --- | --- | --- |
| RFC 7009 | Revocation | Client tells the server a token is no longer needed (logout, uninstall) |
| RFC 7662 | Introspection | Resource server asks whether a token is `active` and what it grants |
| RFC 8414 | `/.well-known/oauth-authorization-server` | Authorization server publishes its endpoints and capabilities |

RFC 8414 metadata lists `issuer`, `authorization_endpoint`, `token_endpoint`, `revocation_endpoint`, `introspection_endpoint` and `code_challenge_methods_supported`, among others. Clients must check that the `issuer` in the document matches the issuer they used to build the URL. Its counterpart for APIs, Protected Resource Metadata (RFC 9728), lets a resource server point clients at its authorization server; the [Model Context Protocol](/specifications/model-context-protocol) requires it.

Token lifetimes, refresh rotation and when to introspect rather than validate locally are covered in [Token Lifecycle](/guides/token-lifecycle).
