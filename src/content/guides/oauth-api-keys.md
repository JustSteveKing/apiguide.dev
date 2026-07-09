---
title: "OAuth 2.0 & API Keys"
description: "How API key authentication compares to OAuth 2.0, and when to use client credentials versus authorization code with PKCE."
category: "security"
---

## Introduction

API keys and OAuth 2.0 solve overlapping but distinct problems: an API key identifies which application or account is calling the API, while OAuth is a delegation protocol that lets an application act on behalf of a user without ever seeing that user's password. This guide covers how to issue and handle both safely. For the HTTP-level mechanics of sending credentials on the wire — Bearer tokens, Basic auth, and Message Signatures — see the [Authentication guide](/guides/authentication); this guide focuses on where the tokens and keys actually come from.

---

## 1. API Key Authentication

An API key is a static, long-lived secret issued to a client, typically tied to a single account or application rather than an individual user. It's the simplest form of API authentication: there's no handshake or expiry to manage, just a string the client attaches to every request.

* **Header (recommended)**: Send the key as a Bearer token or a custom header.
  ```http
  Authorization: Bearer sk_live_51H8x...
  ```
* **Query parameter (discouraged)**: Some older APIs accept `?api_key=sk_live_51H8x...`. Avoid this pattern — query strings are routinely written to server access logs, browser history, and proxy logs in plaintext, so a key sent this way can leak long after the request completes even over TLS.

Because API keys are static, the main risk they carry is that a leaked key remains valid until someone notices and revokes it. Mitigate this by scoping keys narrowly (read-only vs. read-write, specific resources), supporting multiple active keys per account so one can be rotated without downtime, and logging key usage so anomalous activity is detectable.

---

## 2. OAuth 2.0 Client Credentials Grant

The client credentials grant is OAuth's machine-to-machine flow — used when a service needs to call an API on its own behalf, with no end user involved at all. It replaces a static API key with a short-lived access token that's fetched on demand.

### Flow:
1. The client authenticates directly with the authorization server using a client ID and client secret, and the server returns a short-lived access token.
   ```http
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=client_credentials&client_id=abc123&client_secret=shh_dont_tell
   ```
   ```json
   { "access_token": "eyJhbGciOiJSUzI1NiIs...", "token_type": "Bearer", "expires_in": 3600 }
   ```
2. The client attaches that access token as a Bearer credential on subsequent API calls, and requests a new one via the same flow once it expires.

This is preferable to a static API key wherever the credential is held by a backend service rather than distributed to end users, because a stolen access token is only useful for a short window, whereas a leaked static key is valid indefinitely until manually revoked.

---

## 3. Authorization Code Grant with PKCE

When an application needs to act on behalf of a specific user — reading their data, posting on their account — it needs the user's explicit consent without ever handling that user's password. The authorization code grant, combined with PKCE (Proof Key for Code Exchange, RFC 7636), is the standard flow for this in modern APIs, including public clients like mobile and single-page apps that can't safely hold a client secret.

### Flow:
1. **Generate a code verifier and challenge**: The client creates a random `code_verifier` and derives a `code_challenge` from it (a SHA-256 hash, base64url-encoded).
2. **Redirect the user to authorize**: The client sends the user's browser to the authorization server with the `code_challenge`; the user logs in and approves the requested scopes.
   ```
   GET /oauth/authorize?response_type=code&client_id=abc123
     &redirect_uri=https://app.example.com/callback
     &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
   ```
3. **Redirect back with an authorization code**: The authorization server redirects to the client's `redirect_uri` with a short-lived, single-use code (`.../callback?code=auth_code_xyz`).
4. **Exchange the code for tokens**: The client calls the token endpoint, presenting the original `code_verifier` so the server can confirm it matches the earlier `code_challenge` — proving the exchange is coming from the same client that started the flow, not an attacker who intercepted the code in transit. The server responds with an access token and a refresh token.
   ```http
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&code=auth_code_xyz&redirect_uri=https://app.example.com/callback
     &client_id=abc123&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
   ```

PKCE closes a specific vulnerability: without it, an authorization code intercepted in transit (e.g. via a malicious app registering the same custom URL scheme on a mobile device) could be redeemed by an attacker. The verifier never leaves the original client until the final exchange, so a stolen code alone isn't enough.

---

## 4. Refresh Tokens

Access tokens are deliberately short-lived (minutes to a few hours) to limit the damage if one is leaked. Rather than forcing the user to re-authenticate every time one expires, the authorization server also issues a longer-lived **refresh token** that the client exchanges for a new access token.

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=rt_9f8e7d...&client_id=abc123
```

Refresh tokens should be stored more securely than access tokens (they're rarely needed on every request, so they're worth the extra handling cost), and many authorization servers rotate the refresh token itself on each use — issuing a new one and invalidating the old — so a stolen refresh token has a limited window of usefulness even if the theft goes undetected.

---

## 5. Scopes

Scopes let a client (or a user authorizing that client) limit exactly what an access token can do, following the principle of least privilege. Rather than a token granting blanket access to an account, it's restricted to a declared subset of permissions.

```
scope=repos:read issues:write
```

The client requests the scopes it needs during authorization, the user sees and approves them as part of consent, and the resource server checks the token's granted scopes against what the requested operation requires — rejecting with `403 Forbidden` if the token is valid but lacks the necessary scope. Requesting only the minimum scopes an integration actually needs also limits the blast radius if that particular token is ever compromised.
