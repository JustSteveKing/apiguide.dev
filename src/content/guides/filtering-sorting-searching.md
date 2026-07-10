---
title: "Filtering, Sorting & Searching"
description: "Query parameter conventions for filtering, sorting, and full-text search, including operators, pagination interplay, and when to move complex queries to a request body."
category: "core"
---

## Introduction to Querying Collections

A collection endpoint that only returns everything is rarely useful at scale. Clients need to narrow results, order them, and search across them. These operations belong in the query string of a [`GET`](/methods/get) request so they remain safe, cacheable, and bookmarkable.

The challenge is designing conventions that are expressive enough for real needs without turning your query string into a bespoke query language.

---

## 1. Filtering

Filtering restricts a collection to items matching criteria. Two common styles exist. The simplest maps each field to its own parameter:

```http
GET /orders?status=shipped&currency=USD
```

For richer needs, a bracketed `filter` namespace (popularised by JSON:API) keeps filter parameters clearly separated from control parameters like `sort` and `page`:

```http
GET /orders?filter[status]=shipped&filter[currency]=USD
```

Pick one style and apply it everywhere. Mixing `status=` and `filter[status]=` across endpoints confuses clients.

---

## 2. Operators

Equality alone is not enough; clients need ranges and comparisons. Encode the operator either as a suffix or inside the bracket syntax.

| Intent | Example |
| --- | --- |
| Equals | `filter[status]=shipped` |
| Greater than or equal | `filter[total][gte]=100` |
| Less than | `filter[created_at][lt]=2026-01-01` |
| In a set | `filter[status]=shipped,delivered` |
| Not equal | `filter[status][ne]=cancelled` |

Document the supported operators explicitly and reject unknown ones with a [`400 Bad Request`](/status-codes/400) so clients fail loudly rather than silently getting unfiltered data.

---

## 3. Sorting

Use a single `sort` parameter accepting a comma-separated list of fields. Prefix a field with `-` for descending order; ascending is the default.

```http
GET /orders?sort=-created_at,total
```

This reads as "newest first, then by total ascending." Whitelist sortable fields on the server; allowing arbitrary column names invites both errors and, if passed to SQL naively, injection risk.

---

## 4. Searching

Filtering is exact; searching is fuzzy. Expose full-text search through a dedicated `q` parameter, separate from structured filters.

```http
GET /articles?q=distributed+systems&filter[status]=published
```

Keep `q` for human-entered search terms and reserve `filter[...]` for precise field matching. Combining them lets clients search within a filtered subset.

---

## 5. Interplay with Pagination

Filtering, sorting, and pagination compose in one request. Apply filters first, then sorting, then pagination, so page boundaries are stable and meaningful.

```http
GET /orders?filter[status]=shipped&sort=-created_at&page[size]=25&page[number]=2
```

Crucially, sort order must be deterministic for pagination to be reliable. If two rows share a `created_at`, add a tie-breaker such as `id`. See the [pagination guide](/guides/pagination) for cursor versus offset strategies.

---

## 6. When to Use POST or QUERY

Query strings have practical length limits (proxies often cap around 8 KB) and awkwardly encode deeply nested logic. When a query needs boolean groups, geospatial shapes, or long ID lists, move it into a request body.

```http
POST /orders/search HTTP/1.1
Content-Type: application/json

{
  "filter": {
    "or": [
      { "status": "shipped" },
      { "total": { "gte": 500 } }
    ]
  },
  "sort": ["-created_at"]
}
```

A search sub-resource (`/orders/search`) is the pragmatic choice today. The newer **`QUERY`** HTTP method, currently an IETF draft, aims to standardise safe, cacheable requests that carry a body, combining the semantics of `GET` with the flexibility of a payload. Until it is broadly supported, a documented `POST` search endpoint is the reliable option.
