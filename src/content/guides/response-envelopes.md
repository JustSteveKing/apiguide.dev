---
title: "Response Envelope Design"
description: "Weigh wrapping responses in data/meta/errors envelopes against bare bodies, and place pagination and error metadata consistently."
category: "core"
---

## Introduction to Response Envelopes

A response envelope wraps the payload in a consistent outer structure, typically with `data`, `meta`, and `error` fields, so clients always know where to find the primary data, contextual metadata, and error information. The alternative is a bare body that returns the resource directly and relies on HTTP status codes and headers to carry meta information. Neither is universally correct; the choice trades client convenience against HTTP purity and performance. The one non-negotiable is consistency across the whole API surface.

---

## 1. A Response Is More Than Its Body

Every HTTP response has three parts: a status code, headers, and a body. Much of what an envelope might carry is already expressible in the first two.

* **Status code**: the machine-readable outcome, grouped into 1xx informational, 2xx success, 3xx redirection, 4xx client error, and 5xx server error.
* **Headers**: metadata such as `Content-Type`, `Cache-Control`, and rate-limit fields.
* **Body**: the representation itself.

A key anti-pattern is always returning [`200 OK`](/status-codes/200) with an in-body `"success": false` flag. Use real status codes so clients can react without parsing the body.

---

## 2. The Envelope Debate

### Arguments for envelopes

* **Consistency**: a uniform shape simplifies client parsing; the data, metadata, and errors are always in the same place.
* **Extensibility**: new metadata such as trace IDs, pagination links, or debug info can be added without altering the core data structure or breaking clients.
* **Transport flexibility**: decoupling the payload from HTTP-specific headers eases a future move to WebSockets or GraphQL.
* **Clear separation**: business data is explicitly distinct from operational context.

### Arguments for bare bodies

* **HTTP is already an envelope**: status codes and headers convey much of the "meta" without duplication.
* **Simplicity and size**: less boilerplate and smaller payloads for straightforward responses.
* **Performance**: computing metadata such as total counts for every response can be expensive on large datasets.

### What real APIs do

Enveloped and bare designs both have prominent adopters. Facebook and Twitter's v2 API wrap responses; Heroku, GitLab, and GitHub return bare bodies and use headers for metadata such as pagination links. The split reflects philosophy more than correctness.

---

## 3. Error Payloads: RFC 9457 Problem Details

Whatever you choose for success responses, standardize errors. **RFC 9457 (Problem Details for HTTP APIs)**, which supersedes RFC 7807, defines the `application/problem+json` media type.

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
```

```json
{
  "type": "https://api.apiguide.dev/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "The email field is required.",
  "instance": "/v1/users",
  "errors": [
    { "field": "email", "issue": "missing" }
  ]
}
```

Standard fields:

| Field | Meaning |
| --- | --- |
| `type` | Stable URI identifying the problem class, ideally linking to docs |
| `title` | Short human-readable summary, constant per type |
| `status` | HTTP status code for this occurrence |
| `detail` | Human-readable explanation of this specific occurrence |
| `instance` | URI identifying this occurrence, useful for logs |

Problem Details is extensible: add domain-specific members like an `errors` array for multiple validation failures without breaking the contract. Hide stack traces and internal detail on 5xx responses in production. For a deeper treatment see the [error handling guide](/guides/error-handling) and the [Problem Details specification](/specifications/problem-details).

Note that other styles differ: GraphQL returns errors in an `errors` array inside a `200 OK` response, while gRPC uses its own status codes and metadata.

---

## 4. Pagination Metadata Placement

Collections need pagination, and its metadata can live in the body or in headers.

### In the body

Place it in a dedicated `meta` or `pagination` object beside the data.

```json
{
  "data": [ { "id": 125 }, { "id": 126 } ],
  "meta": {
    "pagination": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6MTI2fQ==",
      "prevCursor": "eyJpZCI6MTI1fQ=="
    }
  }
}
```

### In Link headers

Following **RFC 8288** (which updates RFC 5988), the `Link` header carries navigation URLs and keeps the body focused purely on data. GitHub's API uses this approach.

```http
HTTP/1.1 200 OK
Link: <https://api.apiguide.dev/v1/users?cursor=abc>; rel="next",
      <https://api.apiguide.dev/v1/users?cursor=xyz>; rel="prev"
```

Cursor-based pagination is generally preferable to offset-based for large, high-write datasets because it uses indexed values and avoids scanning skipped rows. See the [pagination guide](/guides/pagination) for the full comparison.

---

## 5. Practical Guidance

* Adopt a strategy early, document it, and apply it consistently to both collections and individual resources.
* Use real HTTP status codes; do not tunnel outcomes through a body flag.
* Standardize errors on RFC 9457 Problem Details.
* If you envelope, remember pagination metadata may add a per-request cost on large datasets; if you go bare, lean on headers and expect clients to do a little more work.

There is no single winner. Enveloping buys consistent parsing and extensibility at the cost of complexity and overhead; bare bodies align with native HTTP at the cost of pushing more logic to clients. Consistency across your API matters more than which side you pick.
