---
title: "JSON-LD & Hydra"
description: "A reference for JSON-LD linked data and the Hydra vocabulary, covering @context, @id, @type, hypermedia-driven operations and collections, and a comparison with HAL and JSON:API."
currentVersion: "JSON-LD 1.1"
officialUrl: "https://www.w3.org/TR/json-ld11/"
---

## What is JSON-LD & Hydra?

JSON-LD (JSON for Linking Data) is a W3C standard for encoding Linked Data using ordinary JSON. It lets plain JSON documents carry unambiguous, machine-readable semantics by mapping their terms to IRIs, so that data from different sources can be merged and understood without prior agreement on property names.

Hydra is a vocabulary built on top of JSON-LD that adds hypermedia controls — describing the operations a client may perform, how collections are structured, and how to discover an API's capabilities at runtime. Together, JSON-LD provides the data model and Hydra provides the affordances for a fully hypermedia-driven API.

---

## 1. JSON-LD Keywords

JSON-LD introduces a small set of reserved keywords (prefixed with `@`) that give JSON documents linked-data meaning.

| Keyword     | Purpose                                                              |
|-------------|---------------------------------------------------------------------|
| `@context`  | Maps terms in the document to IRIs and defines value types.         |
| `@id`       | The unique IRI identifier for a node (like a primary key as a URL). |
| `@type`     | The type(s) of a node, expressed as IRIs.                           |
| `@value`    | The literal value of a typed/tagged value object.                   |
| `@graph`    | A set of nodes, used when a document describes multiple resources.  |

A basic JSON-LD document:
```json
{
  "@context": {
    "name": "http://schema.org/name",
    "email": "http://schema.org/email"
  },
  "@id": "https://example.com/people/jane",
  "@type": "http://schema.org/Person",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

The `@context` is what turns the human-friendly key `name` into the globally unique IRI `http://schema.org/name`, removing ambiguity about what `name` means.

---

## 2. The Context

The `@context` can be inlined or referenced by URL, which keeps payloads small and lets many documents share one vocabulary. APIs commonly advertise the context via an HTTP `Link` header:

```http
GET /people/jane HTTP/1.1
Host: example.com
Accept: application/ld+json
```
```http
HTTP/1.1 200 OK
Content-Type: application/ld+json
Link: <https://example.com/contexts/Person>; rel="http://www.w3.org/ns/json-ld#context"
```

The media type for JSON-LD is `application/ld+json`.

---

## 3. Hydra Vocabulary

Hydra extends JSON-LD with terms for describing interactions. Key concepts include:

* **`hydra:Collection`** — a resource representing a set of members, exposed via `hydra:member`.
* **`hydra:Operation`** — a supported operation (an HTTP request), described by `hydra:method`, expected input, and returned type.
* **`hydra:supportedOperation`** — the operations a resource or class supports, enabling clients to discover affordances.
* **`hydra:PartialCollectionView`** — pagination metadata (`hydra:first`, `hydra:next`, `hydra:last`).

A Hydra collection with pagination:
```json
{
  "@context": "https://www.w3.org/ns/hydra/context.jsonld",
  "@id": "/people",
  "@type": "Collection",
  "totalItems": 42,
  "member": [
    { "@id": "/people/jane", "name": "Jane Doe" },
    { "@id": "/people/john", "name": "John Roe" }
  ],
  "view": {
    "@id": "/people?page=1",
    "@type": "PartialCollectionView",
    "first": "/people?page=1",
    "next": "/people?page=2",
    "last": "/people?page=4"
  }
}
```

---

## 4. Describing Operations

Hydra lets the server tell the client what it can do, so the client is not hard-coded to specific verbs and URLs. A property can advertise supported operations:

```json
{
  "@context": "https://www.w3.org/ns/hydra/context.jsonld",
  "@id": "/people/jane",
  "@type": "Person",
  "name": "Jane Doe",
  "operation": [
    { "@type": "Operation", "method": "GET", "returns": "Person" },
    { "@type": "Operation", "method": "PUT", "expects": "Person", "returns": "Person" },
    { "@type": "Operation", "method": "DELETE" }
  ]
}
```

An API may also expose a machine-readable `ApiDocumentation` resource describing all classes and their operations, discoverable via a Hydra `Link` header.

---

## JSON-LD/Hydra vs HAL vs JSON:API

| Aspect             | JSON-LD + Hydra                    | HAL                    | JSON:API                       |
|--------------------|------------------------------------|------------------------|--------------------------------|
| Foundation         | W3C Linked Data / RDF              | Simple JSON convention | Standalone JSON convention     |
| Media type         | `application/ld+json`             | `application/hal+json` | `application/vnd.api+json`     |
| Identity           | `@id` (global IRI)                 | `self` link            | `type` + `id`                  |
| Semantics          | Explicit via `@context`/vocabulary | None                   | None (structural only)         |
| Operations         | Described at runtime (Hydra)       | Implicit via link rels | Fixed by the specification     |
| Best for           | Semantic, self-describing APIs     | Lightweight hypermedia | Prescriptive resource APIs     |

JSON-LD with Hydra is the most powerful and self-describing of the three, at the cost of complexity and an RDF learning curve; HAL is the simplest; JSON:API sits in between with strong, built-in query and relationship conventions.
