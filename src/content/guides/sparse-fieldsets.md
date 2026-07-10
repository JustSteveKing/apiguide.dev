---
title: "Sparse Fieldsets & Partial Responses"
description: "Let clients request only the fields they need with sparse fieldsets, and expand related resources on demand to reduce payload size and round trips."
category: "core"
---

## Introduction to Partial Responses

By default a resource endpoint returns every field of a representation. For rich resources this wastes bandwidth, serialization time, and client parsing effort, especially on mobile networks. Partial responses let a client ask for exactly the fields it needs, and expansion lets it pull in related resources it would otherwise have to fetch separately.

Together these two techniques give REST some of the ad-hoc shaping flexibility that GraphQL is known for, without abandoning HTTP semantics.

---

## 1. Field Selection with `?fields=`

The simplest form lets clients pass a comma-separated list of the fields they want.

```http
GET /users/7?fields=id,name,email
```

```json
{
  "id": 7,
  "name": "Ada Lovelace",
  "email": "ada@example.com"
}
```

Server rules that keep this predictable:

- Always include the resource `id`, even if omitted from the list.
- Ignore or reject unknown field names explicitly rather than failing silently.
- Whitelist selectable fields so clients cannot probe internal columns.

---

## 2. JSON:API Sparse Fieldsets

JSON:API formalises field selection per resource type using a `fields[TYPE]` syntax. This matters when a response contains several types (through inclusion) and you want to trim each independently.

```http
GET /articles?fields[articles]=title,author&fields[people]=name
```

Here `articles` return only `title` and `author`, while any included `people` return only `name`. The type-scoped syntax scales cleanly to compound documents where a flat `fields=` would be ambiguous.

---

## 3. Contrast with GraphQL

GraphQL was designed around precise field selection as a first-class feature; the client declares the exact shape of the response in a query language.

| Aspect | Sparse Fieldsets (REST) | GraphQL |
| --- | --- | --- |
| Selection | Query parameter | Query language |
| Caching | Standard HTTP caching | Needs bespoke tooling |
| Nesting | Shallow, via `include` | Arbitrary depth |
| Learning curve | Minimal | Steeper |

Sparse fieldsets are a lightweight, HTTP-native answer to over-fetching. GraphQL is the heavier tool when clients need deeply nested, highly variable shapes. See [caching](/guides/caching) for why HTTP-native wins matter.

---

## 4. Expanding Related Resources with `?include=`

Under-fetching is the opposite problem: a client fetches an order, then has to make more calls for its customer and line items. Expansion (also called embedding) folds related resources into a single response.

```http
GET /orders/42?include=customer,items
```

```json
{
  "id": 42,
  "status": "shipped",
  "customer": { "id": 7, "name": "Ada Lovelace" },
  "items": [
    { "id": 9, "sku": "ABC-123", "quantity": 2 }
  ]
}
```

Without `include`, related resources are represented by a reference or link that the client can follow, in the spirit of [HATEOAS](/guides/hateoas).

---

## 5. Combining Selection and Expansion

The two features compose: expand a relationship, then trim the fields of both the parent and the expanded resource.

```http
GET /orders/42?include=customer&fields[orders]=status&fields[customers]=name
```

Guard expansion carefully. Deep or unbounded `include` chains can trigger the N+1 query problem or return enormous documents. Cap expansion depth, whitelist expandable relationships, and consider a maximum on how many relationships a single request may expand.

---

## 6. Bandwidth & Performance Benefits

Trimming fields and folding in relations delivers concrete wins:

- **Smaller payloads** — less to serialize, transfer, and parse.
- **Fewer round trips** — expansion collapses several calls into one, which matters most on high-latency mobile links.
- **Lower client complexity** — the client stops orchestrating dependent requests.

Treat these as opt-in optimisations. Default responses should remain complete and predictable, with selection and expansion available to clients that need to tune for their context.
