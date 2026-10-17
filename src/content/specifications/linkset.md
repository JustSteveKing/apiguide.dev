---
title: "Linkset (RFC 9264)"
description: "A reference for RFC 9264, which defines application/linkset and application/linkset+json for publishing sets of web links as a standalone document, plus the linkset link relation for discovering them."
currentVersion: "RFC 9264"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9264.html"
updatedDate: 2026-10-17
---

## What is a Linkset?

[Web Linking](/specifications/web-linking) (RFC 8288) gives a resource a way to describe its relationships: the [`Link`](/headers/link) header, or links embedded in the representation. Both break down at scale. A `Link` header carrying hundreds of links bloats every response and runs into header size limits, and some resources (images, binary downloads, a third party's documents) have no body you can put links in and no headers you control.

RFC 9264, published as a Proposed Standard in July 2022, solves this by moving the links into a document of their own. A **linkset** is a resource whose representation is a set of links, each with an explicit context, a relation type and a target. It defines two serializations, two media types and one link relation, `linkset`, so a resource can point at the set that describes it.

It is a general-purpose format. The best-known consumer today is the [API catalog](/specifications/api-catalog) at `/.well-known/api-catalog` (RFC 9727), which requires it, but linksets are equally useful for describing collections of scholarly objects, assets on a CDN, or anything else whose links are too many or too detached to travel inline.

---

## 1. The two formats

| Media type | Shape | Use it when |
| :--- | :--- | :--- |
| `application/linkset` | The `Link` header syntax, with newlines allowed between links for readability | You already generate `Link` values and want to serve the same thing as a document |
| `application/linkset+json` | A JSON object with a `linkset` array of context objects | Almost always: clients can parse it with a JSON library, and it is what RFC 9727 mandates |

Both are registered in the IANA media types registry. The text format forbids non-ASCII characters, and when converting it back into a `Link` header the newlines must be removed or replaced with spaces. The JSON format must be UTF-8.

Default to `application/linkset+json`. The text format exists mainly for symmetry with RFC 8288; parsing `Link` syntax correctly (quoted strings, commas inside URIs, `title*` encoding) is a well-known source of bugs that the JSON form avoids.

---

## 2. The JSON structure

```json
{
  "linkset": [
    {
      "anchor": "https://example.com/articles/42",
      "author": [
        { "href": "https://example.com/people/ada", "type": "text/html" }
      ],
      "license": [
        { "href": "https://creativecommons.org/licenses/by/4.0/" }
      ],
      "alternate": [
        { "href": "https://example.com/articles/42.pdf", "type": "application/pdf" },
        { "href": "https://example.com/articles/42.fr", "hreflang": ["fr"],
          "title*": [{ "value": "Version fran\u00e7aise", "language": "fr" }] }
      ]
    }
  ]
}
```

The rules are strict, and they are there so every client parses the same thing:

| Level | Rule |
| :--- | :--- |
| Top level | An object whose sole member is `linkset`. Its value is always an array, even with one context. |
| Context object | An optional `anchor` (the link context, which should be an absolute URI), then one member per relation type. |
| Relation member | Registered relations use their registered name (`author`, `next`, `item`); extension relations use their full URI as the member name. The value is always an array of target objects. |
| Target object | `href` is required. Optional: `type`, `media` and `title` as single strings, `hreflang` as an array of strings, `title*` as an array of `{value, language}` objects. |
| Extension attributes | Named after the attribute and always arrays, so a client never has to guess between a string and a list. |

An empty `href` (`"href": ""`) refers to the linkset resource itself. Other JSON extensions to the structure are not recommended, and any that are used must not change the meaning of the defined members.

---

## 3. The linkset relation

A resource advertises where its links live with the `linkset` relation:

```http
HEAD /articles/42 HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Link: <https://example.com/articles/42/links>; rel="linkset"; type="application/linkset+json"
```

The target may contain links whose context is some other resource. A client processes each link independently, may ignore links that do not involve the resource it cares about, and should ignore links with relative references whose context it cannot determine. That last rule is the reason to always write absolute URIs in `anchor` and `href`: a linkset is often fetched from a different URL than the one it describes, and relative references resolve against the wrong base.

---

## 4. The profile parameter

Both media types take an optional `profile` parameter: a space-separated list of URIs identifying conventions the linkset follows. It does not change the meaning of the links; it tells the client what shape to expect.

```http
Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"
```

That is exactly how RFC 9727 marks an API catalog. The same information can be carried as a `profile` attribute on the `linkset` link, or as a separate `profile` link relation (RFC 6906).

---

## Best Practices

* Serve `application/linkset+json` and set the media type explicitly. A linkset served as `application/json` loses the signal that tells a client how to read it.
* Always use absolute URIs for `anchor` and `href`.
* Emit arrays everywhere the spec says arrays, including single-element ones. A client written to the RFC expects an array and can fail on a bare object.
* Do not use a linkset to replace a handful of `Link` headers. It earns its keep when the links are numerous, change independently of the resource, or describe resources you cannot add headers to.
