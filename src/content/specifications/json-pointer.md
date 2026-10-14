---
title: "JSON Pointer (RFC 6901)"
description: "A reference for JSON Pointer, the string syntax for identifying a single value in a JSON document, covering ~0 and ~1 escaping, the URI fragment form, the array '-' token, and its use in JSON Patch, JSON Schema and problem details."
currentVersion: "RFC 6901"
officialUrl: "https://www.rfc-editor.org/rfc/rfc6901.html"
---

## What is JSON Pointer?

JSON Pointer is a string syntax for identifying one specific value inside a JSON document. `/items/0/sku` means "the `sku` member of the first element of the `items` array". It is deliberately tiny: no wildcards, no filters, no recursion. A pointer resolves to exactly one value or to nothing.

That narrowness is why other specifications build on it. [JSON Patch](/specifications/json-patch) uses pointers for every `path` and `from`, [JSON Schema](/specifications/json-schema) and [OpenAPI](/specifications/openapi) use them in `$ref` fragments, and [problem details](/specifications/problem-details) responses use them to point at the field that failed validation. If you need to *query* a document (all prices over 100, every element with a given status), you want JSONPath (RFC 9535), not JSON Pointer.

---

## 1. Syntax

A pointer is a sequence of zero or more reference tokens, each prefixed with `/`. Evaluation starts at the root and steps through one token at a time:

* Against an **object**, a token names a member.
* Against an **array**, a token is a zero-based index written in decimal with no leading zeros (`0`, `7`, `12`, never `01`).
* The **empty string** `""` refers to the whole document. `/` is not the root: it refers to the member whose name is the empty string.

Member names can contain any character, including `/` and `~`, so two characters are escaped inside a token:

| Character | Escaped as |
| --- | --- |
| `~` | `~0` |
| `/` | `~1` |

When decoding, replace `~1` with `/` **first**, then `~0` with `~`. Doing it the other way round turns `~01` into `/` instead of the correct `~1`. When encoding, do the reverse: `~` to `~0` first, then `/` to `~1`.

---

## 2. Worked Examples

Given this document:

```json
{
  "items": [
    { "sku": "TSHIRT-M", "qty": 2 },
    { "sku": "MUG", "qty": 1 }
  ],
  "a/b": 1,
  "m~n": 2,
  "": 3,
  " ": 4
}
```

| Pointer | Value |
| --- | --- |
| `""` | The whole document |
| `/items` | The array |
| `/items/1/sku` | `"MUG"` |
| `/a~1b` | `1` |
| `/m~0n` | `2` |
| `/` | `3` |
| `/%20` | Nothing: no member is named `%20`. Percent-encoding belongs to the fragment form only |
| `/items/2` | Nothing: the array has two elements |

Note that a pointer inside a JSON string is subject to JSON's own escaping first. A member named `k"l` is pointed at with `"/k\"l"` in JSON source; the backslash is JSON syntax, not part of the pointer.

---

## 3. The URI Fragment Form

A pointer can also be written as a URI fragment, which is how it appears in `$ref` and in links. Prefix it with `#` and percent-encode any characters not allowed in a fragment, after encoding the string as UTF-8:

| JSON string form | URI fragment form |
| --- | --- |
| `""` | `#` |
| `/items/0` | `#/items/0` |
| `/a~1b` | `#/a~1b` |
| `/ ` (member named with a space) | `#/%20` |

```yaml
components:
  schemas:
    Order:
      type: object
      properties:
        shippingAddress:
          $ref: '#/components/schemas/Address'
```

Do not mix the two forms. `#/items/0` passed to a JSON Patch implementation is not a valid pointer at all, because a pointer must be empty or begin with `/`. JSON Patch paths use the plain string form.

---

## 4. The `-` Token

RFC 6901 reserves `-` as an array token meaning "the nonexistent element after the last one". It never resolves to a value; it exists so other specifications can give it a meaning. JSON Patch does: `{ "op": "add", "path": "/items/-", "value": {...} }` appends. Anywhere else, treat `-` against an array as an error.

---

## 5. Pointers in Error Responses

RFC 6901 leaves error handling to the specifications that use it, so define it in yours. A pointer that does not resolve should be reported, not silently ignored.

The most visible API use is locating a validation failure. RFC 9457 shows the pattern with a `pointer` extension member in the URI fragment form:

```json
{
  "type": "https://example.com/probs/validation-error",
  "title": "Your request is not valid.",
  "status": 422,
  "errors": [
    { "detail": "must be a positive integer", "pointer": "#/items/1/qty" }
  ]
}
```

`pointer` is not one of the standard problem details members; it is an extension that the example problem type defines. It is still the convention to follow, because a client can resolve it against the request body it sent and highlight the exact field. Whichever form you choose, fragment or plain string, use it consistently across the whole API, and document it at the `type` URI.
