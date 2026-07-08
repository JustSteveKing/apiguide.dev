---
title: "OpenAPI Specification (OAS)"
description: "A comprehensive, multi-section guide to the OpenAPI Specification (OAS), detailing root structures, paths, component registries, and version diffs."
currentVersion: "3.1.0"
officialUrl: "https://spec.openapis.org/oas/v3.1.0"
---

## Core Architecture of OpenAPI

The OpenAPI Specification (OAS) defines a standard, language-agnostic interface to RESTful APIs. It allows both humans and computers to discover and understand the capabilities of a service without access to source code, documentation, or network traffic inspection.

An OpenAPI document is structurally composed of several key root nodes:

### OpenAPI Document Architecture

An OpenAPI document is structured to document all aspects of a REST API contract:
1. **Metadata & Entrypoints (`info` & `servers`)**: Defines descriptive metadata (names, licensing, contacts) and the environment base URLs (development, staging, production).
2. **Routings & Paths (`paths`)**: Maps each relative URI endpoint (e.g., `/orders/{orderId}`) to its supported HTTP methods (Operations).
3. **Operations Schema**: Each method specifies parameters (query, header, path), request body payload structures, and response maps (HTTP status codes matching specific payload schemas).
4. **Reusable Registry (`components`)**: Holds reusable schemas, security mechanisms (OAuth2, Bearer JWT), and parameters that can be reference-pointer linked (`$ref`) throughout the document.

---

## 1. Root-Level Nodes Explained

### Info Object (`info`)
Contains metadata about the API. This is used by developers and documentation generators to understand the context of the service.
* **`title`** (Required): The name of your API.
* **`version`** (Required): The version of your API implementation (not to be confused with the OpenAPI Spec version).
* **`description`**: Extended explanation, supporting CommonMark Markdown.

```yaml
info:
  title: Payments Processing Gateway
  version: "1.4.0"
  description: Secure API endpoints to authorize, process, and refund credit card transactions.
```

### Servers Object (`servers`)
An array of servers providing connectivity information. By defining these, interactive documentation suites (like Swagger UI or Redocly) allow users to test live API calls.
* **`url`** (Required): The base address of the environment.
* **`description`**: A short label describing the environment.
* **`variables`**: Custom parameters (e.g. letting users swap subdomains).

```yaml
servers:
  - url: https://api.payments.apiguide.dev/v1
    description: Production gateway
  - url: https://sandbox-api.payments.apiguide.dev/v1
    description: Testing sandbox environment
```

---

## 2. Paths & Operations (`paths`)

The `paths` object forms the core routing table of the API. Each path item represents a unique endpoint (URI) relative to the server base URL.

### Path Parameters
Endpoints can define variable parameters using curly braces (e.g., `/users/{userId}`). These must be declared inside the `parameters` array of the path or the specific operation.

### HTTP Methods (Operations)
Each path item supports standard HTTP verbs (`get`, `post`, `put`, `patch`, `delete`, `options`, `head`). Each operation must define:
* **`operationId`**: A globally unique identifier for the action, used by SDK code generators as the method name.
* **`parameters`**: Operation-level parameters passed in `query`, `header`, `path`, or `cookie`.
* **`requestBody`**: The payload sent during POST, PUT, or PATCH.
* **`responses`**: A map of status codes to response schemas.

```yaml
paths:
  /orders/{orderId}:
    get:
      summary: Retrieve Order Details
      operationId: getOrder
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: include_refunds
          in: query
          required: false
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Order details found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '404':
          description: Order not found
```

---

## 3. Reusable Components (`components`)

The `components` object serves as a centralized registry for objects that are referenced repeatedly throughout your API description. Objects declared here have no effect unless they are referenced elsewhere using JSON Reference pointers (`$ref`).

Common Component Sub-registries:
* **`schemas`**: Models describing request and response payloads.
* **`securitySchemes`**: Authentication mechanisms (Basic, Bearer JWT, OAuth2, API Keys).
* **`parameters`**: Reusable path, query, or header parameters (e.g., standard pagination query parameters).
* **`headers`**: Common response headers (e.g., rate-limiting response headers).

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Order:
      type: object
      required:
        - id
        - total_amount
      properties:
        id:
          type: string
          format: uuid
        total_amount:
          type: number
          minimum: 0.01
```

---

## 4. Key Differences: OpenAPI 3.0 vs. OpenAPI 3.1

The shift from OpenAPI 3.0 to 3.1 introduced critical modifications designed to align the specification fully with standard JSON Schema draft specifications.

| Feature | OpenAPI 3.0 | OpenAPI 3.1 |
| :--- | :--- | :--- |
| **JSON Schema** | Subset of JSON Schema Draft 5 | Full alignment with JSON Schema Draft 2020-12 |
| **Nullable types** | Uses `nullable: true` | Uses arrays like `type: [string, "null"]` |
| **`exclusiveMinimum`** | Boolean value (works with `minimum`) | Numeric value (replaces `minimum` when exclusive) |
| **Webhooks** | Not natively supported | First-class support via root-level `webhooks` node |
| **File uploads** | Complex `type: file` | Native binary format representation |
