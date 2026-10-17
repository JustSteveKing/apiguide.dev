---
title: "Web Linking (RFC 8288)"
description: "A reference for RFC 8288, which defines the abstract model for typed links, the Link header field, the IANA Link Relations registry and extension relation types, with the relations APIs use for pagination and discovery."
currentVersion: "RFC 8288"
officialUrl: "https://www.rfc-editor.org/rfc/rfc8288.html"
updatedDate: 2026-10-14
---

## What is Web Linking?

RFC 8288, published in October 2017, defines what a link is, independent of any format, and how to send links in HTTP headers with the [`Link`](/headers/link) field. It obsoletes RFC 5988, which it revises rather than replaces: the model and the header are the same, with a clarified syntax and a parsing algorithm.

The model is a sentence: *link context* has a *relation type* resource at *link target*, which has *target attributes*. "Page 2 of these results has a `next` resource at `?page=3`." HTML's `<link>`, Atom's `<link>` and the `Link` header are all serializations of that one model, which is why a relation type means the same thing wherever it appears.

For APIs, the value is that links live in the protocol rather than the payload. A client can follow `next` without knowing whether the body is JSON, CSV or a binary format, and a generic HTTP library can do it for every endpoint at once.

---

## 1. The Link header

```http
Link: <https://api.example.com/orders?cursor=b2Zmc2V0PTQw>; rel="next",
      <https://api.example.com/orders>; rel="first"
```

Each link is a URI reference in angle brackets followed by `;`-separated parameters. Multiple links go in one field, comma-separated, or in repeated `Link` lines; the two forms are equivalent.

| Parameter | Purpose |
| :--- | :--- |
| `rel` | The relation type. Required, and only the first occurrence counts. May hold several space-separated types. |
| `anchor` | Overrides the link context, which defaults to the URL of the response |
| `type` | Hint at the target's media type. Does not override the target's own `Content-Type`. |
| `hreflang` | Hint at the target's language |
| `title`, `title*` | Human-readable label; `title*` carries non-ASCII text using RFC 8187 encoding |
| `media` | Intended destination medium, from HTML |
| `rev` | Reverse relation. Deprecated by RFC 8288; use a separate relation type instead. |

Three parsing rules catch people out. Relative URIs are resolved against the request URL, never against any base URI in the body. Parameter values may be tokens or quoted strings, and a recipient must accept both (`rel=next` and `rel="next"` are the same). And registered relation types compare case-insensitively.

`Link` is not a [Structured Field](/specifications/structured-fields). It predates them, its grammar is its own, and splitting on commas is not a parser: a comma can legally appear inside a URI or a quoted title. Use the parsing algorithm in RFC 8288 Appendix B, or a library that implements it.

---

## 2. Relation types

There are two kinds. **Registered** relation types are short lowercase tokens listed in the IANA Link Relations registry, which uses the Specification Required policy with an expert biased toward approval. **Extension** relation types are absolute URIs that you control, such as `https://api.example.com/rels/invoice`, and need no registration.

Use a registered type when one fits; it is understood by software you have never heard of. Use an extension URI for relations specific to your domain. Do not invent bare tokens like `rel="invoice"`: they are neither registered nor globally unique, and RFC 8288 recognizes only two kinds of relation type: registered tokens and extension URIs. The RFC also advises clients not to dereference extension relation URIs automatically.

Relations you are likely to use in an API:

| Relation | Meaning | Defined in |
| :--- | :--- | :--- |
| `self` | The context's own identifier | RFC 4287 |
| `next`, `prev` | Next and previous in a series | HTML |
| `first`, `last` | Ends of a series | RFC 8288 |
| `collection`, `item` | Collection containing this resource, member of this collection | RFC 6573 |
| `describedby` | A description of the context, such as a JSON Schema | POWDER |
| `service-desc`, `service-doc` | Machine-readable API description (for example an OpenAPI document) and human documentation | RFC 8631 |
| `deprecation` | Human documentation about the context's deprecation | RFC 9745 |
| `sunset` | The context's retirement policy | RFC 8594 |

`previous` is registered as a synonym for `prev`. Emit `prev`, and accept both.

---

## 3. Pagination

Pagination is where most APIs meet `Link`, and it is a good fit:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link: <https://api.example.com/orders?cursor=b2Zmc2V0PTQw>; rel="next",
      <https://api.example.com/orders?cursor=b2Zmc2V0PTA>; rel="prev",
      <https://api.example.com/orders>; rel="first"
```

Send absolute URIs. They are unambiguous behind proxies and survive being logged or copied. Omit a relation rather than sending an empty one: no `next` link is the signal that this is the last page. Only send `last` if you can compute it cheaply; with cursor pagination you usually cannot, and nothing requires it.

Clients should treat the target as opaque and follow it as given, not parse the cursor out of it. That is what lets you change the pagination scheme without a breaking change. The [pagination guide](/guides/pagination) covers cursor and offset design.

GitHub's REST API is a well-known example of this pattern, returning `next`, `prev`, `first` and `last` in `Link` rather than in the body.

---

## 4. Links in the body

RFC 8288 does not define a JSON serialization. If you also want links in the payload, [HAL](/specifications/hal) and [JSON:API](/specifications/json-api) both use relation types from the same registry. Pick one format and use it consistently. Sending the same links in both places is fine for convenience, but the header is the copy that every HTTP client can read without understanding your media type.

---

## 5. Other uses of Link

The header is not limited to pagination. `rel="deprecation"` alongside the [`Deprecation`](/headers/deprecation) header points clients at migration documentation. `rel="service-desc"` on an API root lets tooling discover your OpenAPI document. A [`103 Early Hints`](/status-codes/103) response carries `Link` headers with `rel="preload"` so a browser can start fetching assets while the final response is still being generated.
