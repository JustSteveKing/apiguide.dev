---
title: "API Versioning Strategies"
description: "Compare URI, Header, and Date-based versioning methods, and how to safely deprecate endpoints."
category: "core"
---

## Introduction to API Versioning

API versioning is the practice of managing changes to an API to ensure that existing clients do not break when modifications are made. As your product evolves, database schemas and business logic will change, requiring a strategy to roll out updates safely.

---

## 1. Versioning Methods

There are three primary ways to version REST APIs, each with distinct trade-offs:

### URI Versioning
The version is embedded directly in the URL path.
* **Example**: `https://api.example.com/v1/leads`
* **Pros**: Simple, highly visible, easy to configure on web servers and gateways.
* **Cons**: Violates the principle that a URI should identify a unique resource over its lifetime, rather than its version representation.

### Header Versioning (Content Negotiation)
The version is passed in the `Accept` header using a vendor-specific media type.
* **Example**: `Accept: application/vnd.example.v2+json`
* **Pros**: Preserves clean URIs; represents versioning as content representation.
* **Cons**: Harder to test in browsers; requires complex content negotiation routing on the server.

### Date-Based Versioning (Custom Headers)
The version is defined by a specific release date passed in a custom header (e.g. Stripe's model).
* **Example**: `X-API-Version: 2026-07-07`
* **Pros**: Offers high granularity. Users lock in their registration date and receive backwards-compatible translations on the server.
* **Cons**: Extremely complex to maintain; requires writing middleware chains to transform payloads backwards and forwards.

---

## 2. Deprecation & Sunsetting

When a version or endpoint must be retired, do not shut it down abruptly. Use standard HTTP headers to warn clients programmatically:

* **`Deprecation`**: Tells the client that the endpoint is deprecated and should no longer be used. Can carry a date or boolean value.
* **`Sunset`**: Specifies the exact future timestamp when the endpoint will be turned off permanently.
* **`Link`**: Link to documentation explaining the migration path.

### Example Response:
```http
HTTP/1.1 200 OK
Deprecation: Tue, 07 Jul 2026 00:00:00 GMT
Sunset: Thu, 31 Dec 2026 23:59:59 GMT
Link: <https://apiguide.dev/docs/v2-migration>; rel="successor-version"
```
