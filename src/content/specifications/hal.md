---
title: "HAL (Hypertext Application Language)"
description: "A reference for the Hypertext Application Language, a simple hypermedia format for JSON and XML APIs, covering _links, curies, _embedded resources, and a comparison with JSON:API."
currentVersion: "draft-kelly-json-hal-11"
officialUrl: "https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11"
---

## What is HAL?

HAL (Hypertext Application Language) is a lightweight convention for defining hypermedia such as links to external resources within JSON or XML responses. Its goal is modest and deliberate: give APIs a consistent, minimal way to express relationships between resources so that clients can navigate an API by following links rather than hard-coding URLs.

The JSON variant uses the media type:
```http
Content-Type: application/hal+json
```

HAL models two things on top of an ordinary resource: **links** (via the `_links` property) and **embedded resources** (via the `_embedded` property).

---

## 1. The `_links` Property

`_links` is an object whose keys are link relation types (rel) and whose values are Link Objects (or arrays of them). Each Link Object has at least an `href`.

```json
{
  "_links": {
    "self": { "href": "/orders/523" },
    "next": { "href": "/orders/524" },
    "customer": { "href": "/customers/7" }
  },
  "total": 30.0,
  "currency": "USD",
  "status": "shipped"
}
```

The `self` relation is conventionally present and points at the resource's own URI. Link Objects may also carry properties such as `templated` (true when the href is a URI Template), `type`, `title`, and `name`.

A templated link:
```json
{
  "_links": {
    "search": { "href": "/orders{?id}", "templated": true }
  }
}
```

---

## 2. CURIEs

Custom link relations should be URIs, but full URIs are verbose. HAL borrows CURIEs (Compact URIs) to abbreviate them. A reserved `curies` link defines named templates, which other rels then reference with a `prefix:name` syntax.

```json
{
  "_links": {
    "self": { "href": "/orders/523" },
    "curies": [
      { "name": "acme", "href": "https://docs.acme.com/rels/{rel}", "templated": true }
    ],
    "acme:customer": { "href": "/customers/7" },
    "acme:invoice": { "href": "/invoices/873" }
  }
}
```

Here `acme:customer` expands to `https://docs.acme.com/rels/customer`, which should resolve to human-readable documentation for that relation.

---

## 3. The `_embedded` Property

`_embedded` lets a server include full representations of related resources inline, saving the client additional round trips. Its keys are link relation types, and each value is a resource object (or array of them), each of which may itself contain `_links` and `_embedded`.

```json
{
  "_links": {
    "self": { "href": "/orders" }
  },
  "count": 2,
  "_embedded": {
    "orders": [
      {
        "_links": { "self": { "href": "/orders/523" } },
        "total": 30.0,
        "status": "shipped"
      },
      {
        "_links": { "self": { "href": "/orders/524" } },
        "total": 8.0,
        "status": "processing"
      }
    ]
  }
}
```

Embedded resources are, in principle, full or partial copies of what you would get by following the corresponding link — they are a performance optimization, not a separate data model.

---

## 4. Reserved Properties

HAL reserves exactly two property names on a resource object; everything else is application state:

| Property     | Type   | Purpose                                            |
|--------------|--------|----------------------------------------------------|
| `_links`     | object | Links to related resources, keyed by relation.     |
| `_embedded`  | object | Inlined related resources, keyed by relation.      |

Because only two names are reserved and both are underscore-prefixed, HAL layers cleanly onto existing JSON payloads.

---

## HAL vs JSON:API

Both are hypermedia-oriented JSON formats, but they differ sharply in scope and opinion.

| Aspect              | HAL                              | JSON:API                              |
|---------------------|----------------------------------|---------------------------------------|
| Philosophy          | Minimal, links-first             | Comprehensive, opinionated            |
| Media type          | `application/hal+json`           | `application/vnd.api+json`            |
| Relationships       | `_links` + `_embedded`           | `relationships` + `included`          |
| Query conventions   | None (left to the API)           | Standardized (`sort`, `filter`, `fields`, pagination) |
| Error format        | Not defined                      | Standardized `errors` array           |
| Learning curve      | Very low                         | Moderate                              |

HAL is a good fit when you want hypermedia without adopting a large specification; JSON:API is a better fit when you want a full, prescriptive contract for querying, relationships, and errors out of the box.
