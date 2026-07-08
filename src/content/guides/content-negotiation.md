---
title: "Content Negotiation & Media Types"
description: "Learn how content negotiation works in REST APIs, media types, and standard vendor extensions."
category: "negotiation"
---

## What is Content Negotiation?

Content Negotiation is the mechanism that allows a client and server to agree on the format of the payload returned in the HTTP response. It enables a single URI to serve multiple representations of a resource (such as JSON, XML, or CSV).

---

## 1. Server-Driven Content Negotiation

In server-driven negotiation, the client sends specific headers declaring its preferences:

* **`Accept`**: The desired media formats (e.g. `application/json`).
* **`Accept-Encoding`**: Supported compression algorithms (e.g. `gzip, br`).
* **`Accept-Language`**: Preferred localized languages (e.g. `en-US, es`).

The server evaluates these headers, selects the best representation, and returns it. It must include the **`Content-Type`** header in the response indicating the chosen format.

---

## 2. Media Types (Mime Types)

Media types represent data formats using a standard `type/subtype` syntax.

### Standard Web API Media Types:
* **`application/json`**: The standard format for REST APIs.
* **`application/problem+json`**: The standardized format (RFC 9457) for returning errors.
* **`application/xml`**: Structured XML payloads.

### Vendor-Specific Media Types
Some API providers use custom vendor media types (prefixed with `vnd`) to version their payloads or enforce strict representation formats.
* E.g. `Accept: application/vnd.github.v3+json`
* E.g. `Accept: application/vnd.api+json` (the standard JSON:API format)

---

## 3. Content Negotiation Failures

If the server cannot satisfy any of the client's preferred options:
* **For Accept failures**: The server should return **`406 Not Acceptable`**.
* **For incoming payloads**: If a client POSTs an unsupported body type (e.g. sending XML to a JSON-only endpoint), the server must return **`415 Unsupported Media Type`**.
