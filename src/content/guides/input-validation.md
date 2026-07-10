---
title: "Input Validation & Injection Prevention"
description: "Server-side schema validation, allowlisting, and canonicalization, plus defenses against SQL/NoSQL/command injection and mass assignment."
category: "security"
---

## Introduction to Input Validation

Input validation is the gatekeeper of API security: every value that crosses the boundary must be checked before it reaches business logic, queries, or the operating system. APIs are now a leading application attack vector, and injection is a long-standing risk tracked by OWASP — a standalone entry (API8) in the 2019 API Security Top 10, and folded into broader categories in the 2023 edition. This guide covers the foundational principles — server-side validation, schema enforcement, allowlisting, and canonicalization — then applies them to specific attacks: SQL, NoSQL, and command injection, plus mass assignment and size limits.

For the surrounding controls, see [API security](/guides/api-security), [authentication](/guides/authentication), and the [authorization models](/guides/authorization-models) guide.

---

## 1. Server-Side Validation Is Mandatory

Client-side validation improves user experience but provides no security: an attacker can disable JavaScript or craft HTTP requests directly. Validation must run **server-side**, before any data is processed, as the definitive check on every input.

* Do not trust input parameters or objects, regardless of source.
* Validate length, range, format, and type.
* Reject unexpected or illegal content rather than trying to clean it.
* Return [`400 Bad Request`](/status-codes/400) for malformed input and `413 Request Entity Too Large` for oversized payloads.

---

## 2. Schema Validation

Define the expected structure of every request and response and validate against it, using JSON Schema or your OpenAPI definition. Strong types do a lot of the work: numbers, booleans, dates, and fixed enumerations make many invalid inputs impossible to express.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["email", "quantity"],
  "properties": {
    "email":    { "type": "string", "format": "email", "maxLength": 254 },
    "quantity": { "type": "integer", "minimum": 1, "maximum": 100 }
  }
}
```

Setting `additionalProperties: false` rejects unexpected key-value pairs, which directly closes off mass assignment and other unexpected-field attacks. NIST SP 800-228 calls for strict schema enforcement on both requests *and* responses, specifying data types, allowed ranges, and formats.

---

## 3. Allowlisting (Positive Validation)

Allowlisting explicitly defines what is permitted and rejects everything else by default. It is more secure than denylisting, which tries to enumerate known-bad input and inevitably misses variations.

* Constrain string inputs with carefully designed regular expressions.
* Limit inputs to specific character categories (letters, digits) where possible.
* Beware **regular-expression denial of service (ReDoS)**: a catastrophic pattern against attacker-controlled input can hang a worker. Keep patterns simple and bounded.

Allowlisting shrinks the attack surface to only the inputs you have explicitly reasoned about.

---

## 4. Canonicalization

Canonicalization reduces the many possible encodings of a value to a single, unambiguous form *before* validation. Without it, attackers slip past filters using double encoding or alternative character representations.

* Decode and normalize input to one canonical form, then validate.
* Double encoding is a classic bypass: data pre-encoded so a filter treats it as safe, only to be decoded again downstream into a live payload (for example XSS).
* Validate on input; **encode on output** for the destination context (HTML, URL, shell). The two are complementary, and output encoding is often the overlooked half.

---

## 5. SQL and NoSQL Injection

### SQL injection

The primary defense is **parameterized queries** and **prepared statements**, which keep user input as data rather than executable SQL. Never assemble queries by string concatenation.

```
-- Parameterized: input can never change the query structure
SELECT id, email FROM users WHERE username = ? AND status = ?
```

### NoSQL injection

NoSQL databases use varied query languages, so prevention is product-specific. Attackers inject operators to alter query logic — for example forcing a login check to evaluate true:

```json
{ "username": "admin", "password": { "$ne": null } }
```

Defenses:

* Apply strict input validation and an allowlist of accepted keys.
* Avoid dangerous operators such as MongoDB's `$where`, which allows arbitrary JavaScript execution, and disable server-side JavaScript evaluation.
* Use sanitizing libraries (for example `express-mongo-sanitize`) that strip keys beginning with `$` or containing dots.
* Combine with parameterized queries, access control, and RBAC. NoSQL injection can be more severe than SQL injection because it may execute within a procedural language, and a hostile `$regex` can also cause denial of service.

---

## 6. OS Command Injection

Command injection happens when external input is used to build a system command, letting an attacker run arbitrary commands with the application's privileges.

* **Best defense**: avoid calling OS commands directly. Use built-in library functions instead — for example a native `mkdir()` call rather than `system("mkdir " + name)`.
* If a shell call is unavoidable, use **parameterization** that separates data from the command, and validate both the command (against an allowlist) and its arguments (allowlist or bounded regex).
* In PHP, prefer `escapeshellarg()` — which forces input to a single argument — over `escapeshellcmd()`.

Argument injection is a subtler variant: even without a shell metacharacter, a crafted argument can change a command's behavior. Validate arguments, and use the `--` end-of-options delimiter where the tool supports it.

---

## 7. Mass Assignment

Mass assignment occurs when an API binds client-supplied data directly to internal object properties without filtering, letting an attacker set fields they should not control.

```http
PATCH /users/me HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json

{ "displayName": "Alice", "isAdmin": true }
```

If `isAdmin` is bound blindly, this is privilege escalation. Mass assignment is a form of broken object property level authorization (API3 in the OWASP list) and has caused real incidents.

Prevention:

* **Allowlist** the exact properties a client may set; ignore everything else.
* Use **Data Transfer Objects (DTOs)** so the request model is separate from the persistence model.
* Validate every request against an approved schema with `additionalProperties: false`.
* Validate the caller's permission for each modifiable property, and consider separate endpoints for privileged updates.

---

## 8. Size Limits and Secure Parsing

Bounding request size prevents denial of service, buffer overflows, and resource exhaustion.

* Set an explicit request size limit and reject oversized requests with `413`. Managed gateways enforce their own hard caps — AWS API Gateway, for example, limits payloads to 10MB; large uploads should use a pre-signed URL to object storage instead.
* Cap array and collection sizes and pagination limits. Shopify's APIs, for instance, cap array arguments at 250 items and pagination at 25,000 objects.
* Use a **secure parser**. For XML, choose a parser that is not vulnerable to XML External Entity (XXE) attacks.

---

## 9. Standards to Anchor Against

| Standard | Relevance |
| --- | --- |
| OWASP API Security Top 10 | Injection and mass assignment (API3) among the top risks |
| OWASP Input Validation Cheat Sheet | Allowlisting, schema validation, ReDoS guidance |
| NIST SP 800-228 | Zero-trust API guidance, strict request/response schema validation |
| NIST SP 800-53 Rev. 5 (SI-10) | Information input validation control |
| ISO 27001 (A.12.2.1) | Validation of application inputs |

These frameworks converge on the same message: validate strictly against defined schemas, prefer allowlists, and treat validation as a required, layered control.

---

## Summary

Input validation is not a single check but a layered discipline. Enforce it server-side against explicit schemas, allowlist what is permitted, and canonicalize before comparing. Layer specific defenses on top: parameterized queries for SQL and NoSQL, avoiding direct OS command calls, allowlisting properties to stop mass assignment, and bounding sizes to prevent exhaustion. Combined and anchored to OWASP and NIST guidance, these controls sharply reduce an API's attack surface against an evolving threat landscape.
