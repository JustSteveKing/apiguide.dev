---
title: "JSON:API Specification"
description: "A detailed breakdown of the JSON:API specification, explaining compounds documents, relations, sparse fieldsets, sorting, and pagination models."
currentVersion: "1.1"
officialUrl: "https://jsonapi.org"
---

## What is JSON:API?

JSON:API is a strict, opinionated specification for formatting JSON payloads over HTTP. By standardizing request structures, relationships, error formats, and query parameters, JSON:API eliminates debates about API design, allowing developers to focus on application logic.

JSON:API requires the media type:
```http
Content-Type: application/vnd.api+json
```

---

## 1. The Resource Object

Every resource inside the `data` payload is represented as a structured object containing three mandatory keys:
* **`type`** (Required): Defines the namespace/category of the resource (e.g. `articles`, `users`).
* **`id`** (Required): The unique string identifier.
* **`attributes`**: An object representing the model data fields.

```json
{
  "type": "articles",
  "id": "42",
  "attributes": {
    "title": "Restructuring API specs",
    "status": "published"
  }
}
```

---

## 2. Solving the N+1 Problem with Compound Documents

One of JSON:API's most powerful features is its ability to return related resources in a single response envelope. This avoids requiring clients to execute subsequent HTTP requests (N+1 database queries).

### Query: `GET /articles/1?include=author`
By appending `?include=author`, the server returns:
1. The article in the primary `data` block.
2. The author's profile inside the top-level `included` array.
3. The linkage pointers inside the `relationships` block, connecting them.

```json
{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "JSON:API In-depth Guide"
    },
    "relationships": {
      "author": {
        "data": { "type": "users", "id": "99" }
      }
    }
  },
  "included": [
    {
      "type": "users",
      "id": "99",
      "attributes": {
        "name": "Steve"
      }
    }
  ]
}
```

---

## 3. Query Parameter Standards

JSON:API mandates standard query parameter structures to ensure client/server parsing compatibility:

### Sparse Fieldsets (`fields`)
Restrict returned attributes to reduce bandwidth:
* `?fields[articles]=title` (only return the title field of the article).

### Sorting (`sort`)
Sort responses by attributes. Reverse sort is indicated with a minus sign (`-`):
* `?sort=-created_at,title` (sort descending by date, then ascending by title).

### Filtering (`filter`)
Filter collections:
* `?filter[status]=active` (retrieve only active records).
