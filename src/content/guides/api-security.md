---
title: "API Security Best Practices"
description: "A practical checklist for securing HTTP APIs: TLS, authentication versus authorization, the OWASP API Security Top 10, input validation, rate limiting, and least privilege."
category: "security"
---

## Introduction to API Security

APIs are the most exposed part of most systems: directly reachable, well-documented, and often the fastest path to sensitive data. Security cannot be a layer bolted on at the end; it must be designed into every endpoint.

This guide covers the controls that matter most in practice, anchored to the OWASP API Security Top 10, the industry reference for the risks that actually get APIs breached.

---

## 1. Encrypt Everything with TLS

Serve every endpoint over HTTPS, with no plaintext fallback. Redirect HTTP to HTTPS, and enforce it with HSTS so browsers refuse to downgrade.

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

TLS protects credentials and tokens in transit. Without it, bearer tokens can be captured on the wire and replayed. Terminate TLS at the edge but consider encrypting internal service-to-service traffic too.

---

## 2. Authentication vs Authorization

These are distinct concerns and both are required.

- **Authentication (authn)** answers "who are you?" — validating credentials, tokens, or API keys. See [authentication](/guides/authentication) and [OAuth & API keys](/guides/oauth-api-keys).
- **Authorization (authz)** answers "what are you allowed to do?" — checking whether *this* identity may perform *this* action on *this* resource.

The most common and damaging failure is authenticating correctly but authorizing incompletely.

---

## 3. The OWASP API Security Top 10

The current OWASP list captures the risks responsible for most real breaches. The top entries are all authorization failures.

| Rank | Risk |
| --- | --- |
| API1 | Broken Object Level Authorization (BOLA) |
| API2 | Broken Authentication |
| API3 | Broken Object Property Level Authorization |
| API4 | Unrestricted Resource Consumption |
| API5 | Broken Function Level Authorization |

**BOLA** (API1) is the single most prevalent flaw. It happens when an endpoint returns an object based on an ID in the request without checking the caller owns it:

```http
GET /orders/42
```

If any authenticated user can fetch *any* order 42 simply by changing the number, you have a BOLA vulnerability. Always verify ownership on every object access, server-side, using the authenticated identity, not an ID supplied by the client.

---

## 4. Input Validation

Treat every input as hostile. Validate type, length, format, and range against an explicit schema, and reject anything that does not conform with a [`400 Bad Request`](/status-codes/400) or [`422`](/status-codes/422).

- Prefer allowlists (what is permitted) over denylists (what is blocked).
- Use parameterised queries to prevent injection; never build SQL by string concatenation.
- Guard against mass assignment: bind only the fields a client is allowed to set, not the whole payload.

---

## 5. Rate Limiting & Resource Consumption

Unbounded consumption (API4) enables both denial-of-service and brute-force attacks. Enforce limits on request rate, payload size, page size, and query complexity.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Remaining: 0
```

Return [`429`](/status-codes/429) with a `Retry-After` header when limits are exceeded. See the [rate limiting guide](/guides/rate-limiting) for algorithms and header conventions.

---

## 6. Secrets Management

Never commit secrets to source control, embed them in client apps, or log them.

- Store secrets in a dedicated manager (Vault, AWS Secrets Manager, cloud KMS), injected at runtime.
- Rotate keys and tokens on a schedule and support rotation without downtime.
- Prefer short-lived tokens over long-lived static keys.
- Scrub `Authorization` headers and tokens from logs and error reports.

---

## 7. Least Privilege & Scoped Access

Grant each credential the minimum access it needs. OAuth **scopes** let a token carry only the permissions required for its purpose:

```http
Authorization: Bearer <token issued with scope: orders:read>
```

A read-only integration should never hold a token that can delete resources. Design fine-grained scopes, default to the narrowest, and audit which scopes each client actually uses so you can prune the rest. Combine this with function-level checks so privileged endpoints (admin actions) verify not just a valid token but the right role.
