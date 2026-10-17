---
name: "Link-Template"
description: "Like Link, but the target is a URI Template, so a client can build links itself, such as to any item by ID or any page of results."
category: "both"
standard: true
relatedCodes: [200]
---

## What is the Link-Template header?

The `Link-Template` header, defined in [RFC 9652](https://www.rfc-editor.org/rfc/rfc9652.html) (Standards Track, September 2024), carries templated links in HTTP headers. It is semantically equivalent to [`Link`](/headers/link) from [Web Linking](/specifications/web-linking) (RFC 8288), except that the link target and the link anchor can be [URI Templates](/specifications/uri-template) (RFC 6570). The client expands the template with its own variables to get the actual URI.

Unlike `Link`, it is a [Structured Field](/specifications/structured-fields): a List of Strings, each String a URI Template, with Parameters for the link's metadata.

```http
Link-Template: "/{username}"; rel="item"
```

* `rel` and `anchor` work as they do for `Link`, and their values MUST be Strings. `anchor` may itself contain a template.
* Other target attributes, such as `title`, are Parameters whose values MUST be Strings, or Display Strings if they contain non-ASCII characters.
* `var-base` gives a base URI for the variable names, so that a variable such as `widget_id` can be identified globally as `https://example.org/vars/widget_id`.

Implementations MUST support every level of URI Template defined by RFC 6570, in both the link and the `anchor`.

## API Usage & Best Practices

* **Use it when the client supplies the value.** `Link` is right when the server knows the exact next URI, such as the next page. `Link-Template` is right when the client fills in something only it knows: an ID it has, a search term, a page number it wants. One header describes a whole family of links.
* **Pair a template with a relation type the client understands.** The template tells the client how to build a URI; `rel` tells it what it gets. Use registered relation types such as `item` or `search` where they fit, and a URI you control for anything else.
* **Use `var-base` for shared variables.** If several APIs or resources take the same variable, a `var-base` lets clients recognize it as the same thing rather than matching on a bare name.
* **Do not treat expanded URIs as trusted.** RFC 9652 inherits the security considerations of both Web Linking and URI Templates. Expansion percent-encodes values according to the operator used, but a client that builds requests from server-supplied templates is still following server-supplied URIs. Restrict which origins a client will expand templates for.
* **Do not parse it as `Link`.** The syntax is different: the target is a quoted String, not `<...>`, and the whole value follows Structured Field rules. A `Link` parser will misread it.
* **Expect limited tooling.** Few client libraries understand it yet. If clients must discover links, documenting the template in your API description is still necessary. See [HATEOAS](/guides/hateoas).

## Examples

A link to any item by username, from RFC 9652:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link-Template: "/{username}"; rel="item"
```

A templated anchor, so each book in a list has its own author link:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link-Template: "/books/{book_id}/author"; rel="author"; anchor="#{book_id}"
```

A link whose variable names are globally identified with `var-base`, from RFC 9652:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link-Template: "/widgets/{widget_id}"; rel="https://example.org/rel/widget"; var-base="https://example.org/vars/"
```

A search template on a collection, with a query-expansion operator:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link-Template: "/v1/orders{?status,created_after}"; rel="search"
```
