---
title: "HATEOAS & Hypermedia APIs"
description: "How hypermedia controls make REST APIs self-describing through links in responses, the HAL and JSON:API formats, and an honest look at why adoption is limited."
category: "core"
---

## Introduction to HATEOAS

HATEOAS, Hypermedia As The Engine Of Application State, is the constraint that separates Level 3 of the [Richardson Maturity Model](/guides/rest-principles) from everything below it. The idea: a client should be able to navigate an API purely by following links returned in responses, rather than by hard-coding URLs from documentation.

It is the same model as a web browser. You do not memorise URLs for every page; you follow links. HATEOAS applies that principle to machine clients.

---

## 1. Links in Responses

A hypermedia response includes not just data, but the actions available on that data, expressed as links. The client discovers what it can do next from the response itself.

```json
{
  "id": 42,
  "status": "pending",
  "total": "49.99",
  "_links": {
    "self":   { "href": "/orders/42" },
    "cancel": { "href": "/orders/42/cancel", "method": "POST" },
    "pay":    { "href": "/orders/42/payment", "method": "POST" }
  }
}
```

The presence of `cancel` and `pay` tells the client this order can be cancelled or paid. Once the order ships, the server simply stops returning those links, so the available state transitions are always driven by the server.

---

## 2. `_links` and `links` Conventions

There is no single mandated shape, but two conventions dominate. Each defines where links live and how they are keyed by relation name (`rel`).

- **HAL** nests links under a `_links` object.
- **JSON:API** uses a `links` object and separately models relationships.

Relation names follow either the IANA registered link relations (`self`, `next`, `prev`) or custom, ideally URI-namespaced, names for domain-specific actions.

---

## 3. HAL (Hypertext Application Language)

HAL is a minimal, widely-used media type served as `application/hal+json`. It defines `_links` for hypermedia and `_embedded` for inlined related resources.

```http
GET /orders/42 HTTP/1.1
Accept: application/hal+json
```

```json
{
  "id": 42,
  "status": "shipped",
  "_links": {
    "self": { "href": "/orders/42" },
    "customer": { "href": "/customers/7" }
  },
  "_embedded": {
    "items": [
      { "sku": "ABC-123", "quantity": 2, "_links": { "self": { "href": "/items/9" } } }
    ]
  }
}
```

Its low ceremony is why HAL is the most common hypermedia format in production.

---

## 4. JSON:API

JSON:API is a more prescriptive specification served as `application/vnd.api+json`. It standardises pagination links, relationship links, and [sparse fieldsets](/guides/sparse-fieldsets) in one package.

```json
{
  "data": {
    "type": "orders",
    "id": "42",
    "attributes": { "status": "shipped" },
    "relationships": {
      "customer": {
        "links": { "related": "/customers/7" }
      }
    }
  },
  "links": { "self": "/orders/42" }
}
```

Because it dictates so much structure, JSON:API reduces bikeshedding across teams at the cost of some flexibility.

---

## 5. Discoverability Benefits

When done well, hypermedia delivers real advantages:

- **Loose coupling** — clients follow links instead of constructing URLs, so servers can restructure URIs without breaking clients.
- **Server-driven workflow** — available actions live in the response, so business rules about valid state transitions stay on the server.
- **Explorability** — a developer can navigate the entire API starting from a single root document.

---

## 6. Why Adoption Is Limited

Despite being core to Fielding's REST, full HATEOAS is uncommon. The reasons are practical:

- **Client complexity** — few client libraries navigate hypermedia automatically, so developers often just extract the `href` and treat it like a hard-coded URL anyway, negating the benefit.
- **Payload overhead** — link sections can dwarf the actual data.
- **Tooling gap** — code generators, SDKs, and documentation tools are built around static endpoint lists, not runtime discovery.
- **Diminishing returns** — many APIs serve a single first-party client where the coupling HATEOAS removes was never a real problem.

The pragmatic middle ground: include a few high-value links (`self`, pagination `next`/`prev`, key state transitions) without committing to full hypermedia-driven navigation. This captures much of the value at a fraction of the cost.
