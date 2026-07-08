---
title: "Standardized Error Handling"
description: "Designing centralized error dictionaries, parsing field-level validation errors, and structure guidelines."
category: "core"
---

## Introduction to Error Design

A well-designed API prioritizes clear, developer-friendly error responses. When an API call fails, the client needs to understand *why* it failed (machine-readable classification) and *how* to correct it (human-readable metadata).

---

## 1. The Case for RFC 9457 (Problem+JSON)

Instead of nesting errors in custom schemas (like `{"status": "error", "msg": "..."}`), adopt the standard **`application/problem+json`** specification.

This guarantees a predictable envelope for all client and server failures:
* `type`: A URI pointing to documentation for the specific error.
* `title`: Static category name (e.g., "Validation Failed").
* `status`: The HTTP status code.
* `detail`: Context-specific explanation of this occurrence.

---

## 2. Formatting Field-Level Validation Errors

Validation failures on payloads require returning details about individual fields. Extend the Problem+JSON response by nesting an `errors` object containing array fields:

```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The payload sent failed business rules validation.",
  "errors": {
    "email": [
      "The email address is already registered.",
      "The email domain must match the company domain."
    ],
    "password": [
      "The password must contain at least one special character."
    ]
  },
  "instance": "/v1/users"
}
```

---

## 3. Decoupling HTTP Status and Domain Codes

HTTP status codes are generic (e.g., 400 Bad Request, 403 Forbidden). Often, your application requires domain-specific errors (e.g., `insufficient_funds` or `limit_exceeded`).

* **Use URIs**: Use the `type` field URI (or a custom `code` token) to convey the specific domain error code.
* **Keep HTTP status correct**: Never return a 200 OK containing an error object. Ensure transport-level status codes match the HTTP layer.
