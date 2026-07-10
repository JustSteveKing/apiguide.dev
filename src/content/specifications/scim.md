---
title: "SCIM (System for Cross-domain Identity Management)"
description: "A reference for SCIM 2.0, the standard protocol for automating user and group provisioning across identity providers and applications, covering the core schema, resource endpoints, PATCH operations, and filtering."
currentVersion: "2.0"
officialUrl: "https://www.rfc-editor.org/rfc/rfc7644"
---

## What is SCIM?

SCIM (System for Cross-domain Identity Management) is an open standard that automates the exchange of user identity information between identity domains. In practice, it is the protocol that lets an enterprise identity provider (such as Okta, Entra ID, or Google Workspace) create, update, deactivate, and delete user accounts in a downstream SaaS application — without manual administration.

SCIM 2.0 is defined across two RFCs: the core schema (RFC 7643) and the protocol (RFC 7644). It uses REST over HTTP with JSON payloads identified by the media type `application/scim+json`.

---

## 1. Core Schema

SCIM defines two core resource types: **User** and **Group**. Every resource carries a `schemas` array declaring which schema(s) it conforms to, plus common attributes like `id` (server-assigned), `externalId` (client-assigned), and `meta`.

A minimal User resource:
```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "id": "2819c223-7f76-453a-919d-413861904646",
  "externalId": "701984",
  "userName": "jane@example.com",
  "name": {
    "givenName": "Jane",
    "familyName": "Doe"
  },
  "emails": [
    { "value": "jane@example.com", "type": "work", "primary": true }
  ],
  "active": true,
  "meta": {
    "resourceType": "User",
    "created": "2024-01-15T04:56:22Z",
    "location": "/Users/2819c223-7f76-453a-919d-413861904646"
  }
}
```

The `active` boolean is central to deprovisioning — setting it to `false` is the standard way to disable an account.

---

## 2. Resource Endpoints

SCIM exposes a predictable set of REST endpoints per resource type:

| Method   | Endpoint            | Purpose                                  |
|----------|---------------------|------------------------------------------|
| `POST`   | `/Users`            | Create a user.                           |
| `GET`    | `/Users/{id}`       | Retrieve a single user.                  |
| `GET`    | `/Users`            | Query/list users (with filtering).       |
| `PUT`    | `/Users/{id}`       | Replace a user entirely.                 |
| `PATCH`  | `/Users/{id}`       | Partially modify a user.                 |
| `DELETE` | `/Users/{id}`       | Delete a user.                           |

The same set applies to `/Groups`. Service providers also expose discovery endpoints: `/ServiceProviderConfig`, `/ResourceTypes`, and `/Schemas`.

---

## 3. PATCH Operations

`PATCH` is the workhorse for incremental changes, since identity providers rarely resend the whole resource. A PATCH request uses the PatchOp schema with a list of `Operations`, each with an `op` of `add`, `replace`, or `remove`.

Deactivating a user and updating a title:
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    { "op": "replace", "path": "active", "value": false },
    { "op": "replace", "path": "title", "value": "Former Employee" }
  ]
}
```

Adding a member to a group uses a filtered path or the `members` attribute:
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    {
      "op": "add",
      "path": "members",
      "value": [{ "value": "2819c223-7f76-453a-919d-413861904646" }]
    }
  ]
}
```

---

## 4. Filtering

SCIM defines a query filter grammar passed via the `filter` query parameter. It supports comparison operators (`eq`, `ne`, `co`, `sw`, `ew`, `gt`, `ge`, `lt`, `le`, `pr`) and logical operators (`and`, `or`, `not`).

Find a user by their username:
```http
GET /Users?filter=userName eq "jane@example.com" HTTP/1.1
Host: scim.example.com
Accept: application/scim+json
```

List responses are wrapped in a ListResponse envelope:
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 1,
  "startIndex": 1,
  "itemsPerPage": 1,
  "Resources": [
    { "id": "2819c223-7f76-453a-919d-413861904646", "userName": "jane@example.com" }
  ]
}
```

Pagination uses the `startIndex` (1-based) and `count` query parameters.

---

## 5. Enterprise Use

SCIM is the backbone of enterprise SSO and directory synchronization. Combined with SAML or OIDC for authentication, SCIM handles the lifecycle: when an employee joins, the IdP provisions their account; when their role changes, it patches attributes and group membership; when they leave, it sets `active` to `false` or deletes the resource. The Enterprise User extension schema (`urn:ietf:params:scim:schemas:extension:enterprise:2.0:User`) adds workforce attributes like `employeeNumber`, `department`, and `manager`.
