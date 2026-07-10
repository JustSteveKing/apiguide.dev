---
title: "OpenID Connect (OIDC)"
description: "A reference for OpenID Connect, the identity layer on top of OAuth 2.0, covering the ID Token, the authorization code flow with PKCE, the UserInfo endpoint, discovery, and standard scopes."
currentVersion: "1.0"
officialUrl: "https://openid.net/specs/openid-connect-core-1_0.html"
---

## What is OpenID Connect?

OpenID Connect (OIDC) is a thin identity layer built on top of the OAuth 2.0 authorization framework. Where OAuth 2.0 answers "is this client allowed to access this resource?", OIDC answers "who is the user, and how were they authenticated?". It standardizes authentication so that a client (the Relying Party) can verify a user's identity based on the work of an OpenID Provider (OP), and obtain basic profile information in an interoperable way.

The central artifact OIDC adds to OAuth 2.0 is the **ID Token**, a signed JWT that asserts the user's identity.

---

## 1. The ID Token

The ID Token is always a JWT (JWS) and carries claims about the authentication event. Unlike an OAuth access token — which is opaque to the client — the ID Token is meant to be read and validated by the Relying Party.

```json
{
  "iss": "https://accounts.example.com",
  "sub": "248289761001",
  "aud": "s6BhdRkqt3",
  "exp": 1735689600,
  "iat": 1735686000,
  "auth_time": 1735685990,
  "nonce": "n-0S6_WzA2Mj",
  "email": "jane@example.com",
  "email_verified": true
}
```

Key OIDC-specific claims:
* **`sub`** — a stable, unique identifier for the user within the issuer.
* **`aud`** — must contain the client's `client_id`.
* **`nonce`** — binds the token to the authorization request to prevent replay.
* **`auth_time`** — when the user actually authenticated.

---

## 2. Authorization Code Flow with PKCE

The recommended flow for nearly all clients is the authorization code flow, hardened with PKCE (Proof Key for Code Exchange). PKCE prevents authorization code interception attacks and is required for public clients such as SPAs and mobile apps.

### Step 1 — Authorization Request
The client redirects the user to the authorization endpoint:
```http
GET /authorize?
  response_type=code&
  client_id=s6BhdRkqt3&
  redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb&
  scope=openid%20profile%20email&
  state=af0ifjsldkj&
  nonce=n-0S6_WzA2Mj&
  code_challenge=E9Melhoa2Ow...&
  code_challenge_method=S256 HTTP/1.1
Host: accounts.example.com
```

### Step 2 — Token Request
After the user authenticates and consents, the client exchanges the returned `code` (plus the original `code_verifier`) at the token endpoint:
```json
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The client must validate the `id_token` signature, `iss`, `aud`, `exp`, and `nonce` before trusting the identity.

---

## 3. The UserInfo Endpoint

Beyond the claims in the ID Token, a Relying Party can fetch profile claims from the UserInfo endpoint by presenting the access token:

```http
GET /userinfo HTTP/1.1
Host: accounts.example.com
Authorization: Bearer SlAV32hkKG
```

```json
{
  "sub": "248289761001",
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane@example.com",
  "email_verified": true
}
```

The `sub` returned by UserInfo must match the `sub` in the ID Token.

---

## 4. Discovery

OIDC providers publish their configuration at a well-known URL so clients can auto-configure endpoints and keys:

```http
GET /.well-known/openid-configuration HTTP/1.1
Host: accounts.example.com
```

```json
{
  "issuer": "https://accounts.example.com",
  "authorization_endpoint": "https://accounts.example.com/authorize",
  "token_endpoint": "https://accounts.example.com/token",
  "userinfo_endpoint": "https://accounts.example.com/userinfo",
  "jwks_uri": "https://accounts.example.com/jwks",
  "response_types_supported": ["code"],
  "scopes_supported": ["openid", "profile", "email"]
}
```

The `jwks_uri` provides the public keys used to verify ID Token signatures.

---

## 5. Standard Scopes

Scopes control which claims are released. The `openid` scope is mandatory — its presence is what turns an OAuth request into an OIDC request.

| Scope     | Grants access to claims such as                          |
|-----------|---------------------------------------------------------|
| `openid`  | Required. Signals an OIDC request; returns `sub`.       |
| `profile` | `name`, `family_name`, `given_name`, `picture`, `locale`|
| `email`   | `email`, `email_verified`                               |
| `address` | `address`                                               |
| `phone`   | `phone_number`, `phone_number_verified`                 |

---

## OIDC vs Plain OAuth 2.0

| Concern            | OAuth 2.0            | OpenID Connect                 |
|--------------------|----------------------|--------------------------------|
| Primary purpose    | Authorization        | Authentication (+ authorization)|
| Identity token     | None                 | ID Token (JWT)                 |
| User info          | Non-standard         | UserInfo endpoint + scopes     |
| Configuration      | Out-of-band          | Discovery document             |
