---
title: "Media Types & Vendor Content Types"
description: "How media types structure content, how the vendor tree and +json suffix work, and how to version APIs through the Accept header."
category: "negotiation"
---

## Introduction to Media Types

Media types — also called MIME types or content types — identify the format of data exchanged over HTTP. Registered by IANA and governed by RFC 6838, they underpin [content negotiation](/guides/content-negotiation), API versioning, and interoperability. A media type tells a recipient how to parse a body: `application/json` is JSON, `text/html; charset=utf-8` is UTF-8 HTML. Understanding their structure, the vendor tree, and structured suffixes lets you design content types that evolve without breaking clients.

---

## 1. Structure and Registration Trees

A media type is a `type/subtype` pair, optionally followed by `;` parameters. Type and subtype names are case-insensitive; parameter values follow per-parameter rules.

```
application/vnd.api+json; version=2
└─────────┘ └─┘└─┘ └──┘  └───────┘
   type    tree name suffix parameter
```

The top-level `type` categorizes the data (`application`, `text`, `image`, `audio`, `video`, and others). RFC 6838 organizes subtypes into registration trees:

| Tree | Prefix | Purpose |
| --- | --- | --- |
| Standards | *(none)* | General-interest types approved by IETF or recognized bodies. |
| Vendor | `vnd.` | Types tied to a publicly available product; lets vendors define custom formats. |
| Personal | `prs.` | Experimental or non-commercial use. |
| Unregistered | `x.` | Private, local use; discouraged now that vendor/personal registration is simple. |

### The structured suffix

A `+suffix` names the underlying data format regardless of the specific semantics. `application/vnd.api+json` is parseable as JSON (`+json`) but adds the semantics defined by the JSON:API specification. Common suffixes include `+json`, `+xml`, and `+zip`. This lets a generic parser recognize the base structure even for a custom type.

---

## 2. The `Content-Type` and `Accept` Headers

Two headers carry media types across the request/response cycle.

### `Content-Type`

The [`Content-Type`](/headers/content-type) header declares the media type of a message body. Servers set it on responses so clients know how to interpret the payload; clients set it on `POST`, `PUT`, and `PATCH` requests to describe the body they are sending.

```http
POST /orders HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json

{ "sku": "A-100", "qty": 3 }
```

### `Accept`

The [`Accept`](/headers/accept) header lets a client state which media types it is willing to receive, enabling content negotiation. Wildcards (`*/*`, `type/*`) and `q` quality values rank preferences.

```http
GET /orders/501 HTTP/1.1
Host: api.apiguide.dev
Accept: application/json, text/csv;q=0.8
```

This client prefers JSON but accepts CSV if JSON is unavailable. Note that while `q` is standard in `Accept`, the media type registry disallows a `q` parameter in registration to avoid interfering with negotiation.

---

## 3. Versioning via Media Types

Media types offer an alternative to URL-path versioning that keeps a single URI stable across versions. Version information can live in the subtype name or in a parameter:

```http
Accept: application/vnd.status.v2+json
```

```http
Accept: application/vnd.status+json; version=2
```

JSON:API uses `application/vnd.api+json` with `ext` and `profile` parameters to negotiate extensions and profiles — a form of semantic negotiation layered on the base type. When a request uses the JSON:API media type with any parameter other than `ext` or `profile`, servers must respond with [`415 Unsupported Media Type`](/status-codes/415). See the [versioning guide](/guides/versioning) for how this compares to path- and header-based schemes.

---

## 4. Best Practices

* **Prefer standard types.** Use `application/json` (and `application/xml` where needed) for general data exchange; reach for custom types only when new semantics demand it.
* **Design custom types sparingly.** Create a `vnd.*` type when a resource carries genuinely new processing semantics, not for every minor variation, and document it publicly.
* **Always set `Content-Type`.** Set it accurately on every response and on every request that carries a body, including a `charset` for text formats.
* **Default to JSON.** When `Accept` is absent, respond with JSON for maximum compatibility.
* **Vary on `Accept`.** When a response's format depends on the `Accept` header, add [`Vary: Accept`](/headers/vary) so caches store representations separately.
* **Disable MIME sniffing.** Send `X-Content-Type-Options: nosniff` so browsers do not second-guess your declared type.

---

## 5. Common Pitfalls

* **Media type explosion.** Minting an overly specific type for every attribute or resource complicates the API and hurts interoperability. Favor "chunky" representations over fine-grained ones, and let a schema — not the media type — describe structure.
* **Unsupported request bodies.** If a client sends a body the server cannot process, return [`415 Unsupported Media Type`](/status-codes/415).
* **Ignored client preferences.** If no representation satisfies the `Accept` header, return [`406 Not Acceptable`](/status-codes/406), ideally listing supported formats.
* **Missing or mismatched `Content-Type`.** An absent header, or one that disagrees with the actual body, commonly produces a `400 Bad Request`.

---

## Summary

Media types are the vocabulary of HTTP content negotiation. Their `type/subtype` structure, the `vnd.` vendor tree, and the `+json` structured suffix together allow custom formats that generic tooling can still parse. Carry them with `Content-Type` and `Accept`, use them judiciously for versioning, default to standard types, and return `415` or `406` when negotiation fails — the result is an interoperable API that can evolve without breaking its clients.
