---
title: "API Authentication Schemes"
description: "A guide to HTTP-level authentication standards including Basic Auth, Bearer Tokens, and Message Signatures."
category: "security"
---

## Introduction to API Authentication

Authentication is the process of verifying the identity of the client sending a request. HTTP provides standardized header structures to handle authentication challenges and credentials.

---

## 1. Bearer Token Authentication (RFC 6750)

The `Bearer` scheme is the industry standard for securing modern REST APIs, typically carrying JSON Web Tokens (JWTs), OAuth access tokens, or random opaque API keys.

### Protocol Flow:
1. The client requests protected resources by sending the token in the [`Authorization`](/headers/authorization) header:
   ```http
   Authorization: Bearer my_secure_token_123
   ```
2. If the token is missing, invalid, or expired, the server returns a [**`401 Unauthorized`**](/status-codes/401) response.
3. RFC 6750 recommends the server include the [**`WWW-Authenticate`**](/headers/www-authenticate) header indicating the scheme and realm:
   ```http
   WWW-Authenticate: Bearer realm="api"
   ```

---

## 2. Basic Access Authentication (RFC 7617)

Basic authentication is a simple, legacy protocol where client credentials (username and password) are sent in the header.

### Protocol Flow:
1. The client concatenates username and password with a colon (`user:password`), base64 encodes it, and sends it:
   ```http
   Authorization: Basic dXNlcjpwYXNzd29yZA==
   ```
2. Basic auth should only be used over TLS (HTTPS) connections, as base64 is trivially decoded by anyone sniffing network traffic.

---

## 3. HTTP Message Signatures (RFC 9421)

For high-security APIs (like open banking, payment processors, or Webhooks), token authentication is insufficient because a compromised token can be replayed. HTTP Message Signatures provide cryptographic verification of the request headers and body.

### Protocol Flow:
1. The client signs specific request elements (like method, path, and body hash) using a private key.
2. The signature is sent in a structured `Signature` header.
3. The server uses the client's public key to verify that the request has not been tampered with in transit (data integrity) and originated from the declared client (authenticity).
