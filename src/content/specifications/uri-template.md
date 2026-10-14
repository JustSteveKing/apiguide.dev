---
title: "URI Template (RFC 6570)"
description: "A reference for RFC 6570 URI Templates: the four levels, expression operators, the prefix and explode modifiers, how HAL and hypermedia APIs use templated links, and how OpenAPI path templating differs from RFC 6570."
currentVersion: "RFC 6570"
officialUrl: "https://www.rfc-editor.org/rfc/rfc6570.html"
---

## What is a URI Template?

RFC 6570, published in March 2012, defines a compact syntax for describing a range of URIs by putting variable expressions in braces, and an exact algorithm for expanding them into a URI given a set of values. `/orders{?status,limit}` describes `/orders`, `/orders?status=open` and `/orders?status=open&limit=20`, and every conformant library produces the same string from the same inputs.

The point is that a server can publish *how* to build a URI without the client hard-coding the layout. GitHub's REST API, for example, returns `*_url` properties that its documentation says are RFC 6570 templates, such as `/notifications{?since,all,participating}`, and tells clients to expand them rather than construct URLs themselves.

A URI Template is not a URI. It must not be used where a URI is expected until it has been expanded, and RFC 6570 asks formats to use distinct field names for templates, which is why HAL marks them with `templated: true`.

---

## 1. Levels

The RFC groups features into four levels so a library can state what it supports. Each level includes the ones below it.

| Level | Adds | Example | Expansion |
| :--- | :--- | :--- | :--- |
| 1 | Simple string expansion | `{hello}` | `Hello%20World%21` |
| 2 | `+` reserved expansion, `#` fragment expansion | `{+path}/here` | `/foo/bar/here` |
| 3 | Multiple variables per expression; `.`, `/`, `;`, `?`, `&` operators | `{?x,y}` | `?x=1024&y=768` |
| 4 | Prefix (`:n`) and explode (`*`) modifiers | `{/list*}` | `/red/green/blue` |

These and the examples below use the RFC's own variable values: `hello` is `Hello World!`, `path` is `/foo/bar`, `x` is `1024`, `y` is `768`, `list` is `red`, `green`, `blue`, and `var` is `value`.

Check which level a client library implements before you rely on modifiers. If you publish templates for third parties, staying within Level 3 is a cheap way to avoid surprising a minimal client.

---

## 2. Operators

The character after the opening brace selects the operator, which decides the prefix, the separator between values, and whether reserved characters are encoded.

| Operator | Name | Example | Expansion |
| :--- | :--- | :--- | :--- |
| none | Simple string | `{x,y}` | `1024,768` |
| `+` | Reserved string | `{+path}` | `/foo/bar` |
| `#` | Fragment | `{#path}` | `#/foo/bar` |
| `.` | Label | `X{.x,y}` | `X.1024.768` |
| `/` | Path segment | `{/var,x}` | `/value/1024` |
| `;` | Path-style parameter | `{;x,y}` | `;x=1024;y=768` |
| `?` | Form-style query | `{?x,y}` | `?x=1024&y=768` |
| `&` | Query continuation | `?fixed=yes{&x}` | `?fixed=yes&x=1024` |

Encoding is the part that matters for safety. Every operator except `+` and `#` percent-encodes anything outside the unreserved set, so `{/var}` with a value of `a/b` expands to `/a%2Fb`, one segment. Use `+` only for values you control and that are meant to contain `/`, `?` or `#`, because it lets a value add path segments or a query.

Undefined variables are skipped entirely, including their prefix and separator. `{?x,y}` with only `x` defined expands to `?x=1024`, which is what makes optional query parameters work. The characters `=`, `,`, `!`, `@` and `|` are reserved as operators for future extensions.

---

## 3. Modifiers

Level 4 adds two modifiers on individual variables:

```text
{var:3}       val                              prefix: first 3 characters
{?list}       ?list=red,green,blue             list joined with commas
{?list*}      ?list=red&list=green&list=blue   explode: one pair per member
{/list*}      /red/green/blue                  explode: one segment per member
```

Explode also applies to associative arrays: with the RFC's `keys` variable, which maps `semi` to `;`, `dot` to `.` and `comma` to `,`, `{?keys*}` expands to `?semi=%3B&dot=.&comma=%2C`. Whether your server reads repeated parameters (`list=red&list=green`) or comma-joined ones (`list=red,green`) is your API's decision; the template should match it, not the other way round.

---

## 4. Templated links in hypermedia

[HAL](/specifications/hal) allows a Link Object's `href` to be a URI Template and says it SHOULD then carry `"templated": true`:

```json
{
  "_links": {
    "self": { "href": "/orders?page=2" },
    "find": { "href": "/orders/{id}", "templated": true },
    "search": { "href": "/orders{?status,customer}", "templated": true }
  }
}
```

A client expands `find` with an `id` and never assembles the path itself. HAL's CURIEs use the same mechanism: the `curies` link is a template with a `{rel}` variable. The `Link` header from [Web Linking](/specifications/web-linking) carries URIs only, not templates.

---

## 5. OpenAPI is not RFC 6570

OpenAPI path templates look like URI Templates and are not. `/orders/{orderId}` in an OpenAPI document uses OpenAPI's own path templating, where each `{name}` must correspond to a declared path parameter and the parameter's value must not contain an unescaped `/`, `?` or `#`. There are no operators: `{+path}`, `{/segments*}` or `{?query}` in a `paths` key are not valid OpenAPI. OpenAPI 3.2 gives path templating its own ABNF, which allows only plain `{name}` expressions.

RFC 6570 does appear in OpenAPI, in a different place. Parameter serialization is defined in terms of it: the `style`, `explode` and `allowReserved` fields map onto RFC 6570 operators and modifiers (`matrix` to `;`, `label` to `.`, `form` to `?`, `explode: true` to `*`, `allowReserved: true` to `+`), as set out in the specification's appendix on RFC 6570-based serialization. Server Object URLs use `{variable}` substitution with a fixed list of Server Variables, which is also not general URI Template expansion.

The practical rule: do not feed an OpenAPI path to an RFC 6570 library and expect parameter serialization to match, and do not put RFC 6570 operators in an OpenAPI path. Use the [OpenAPI](/specifications/openapi) parameter definitions to describe how values are encoded.

---

## 6. Matching is not what it is for

RFC 6570 defines expansion only. Some templates can be run in reverse to extract variables from a URI, but the RFC itself says this works only when expressions are bounded by characters their values cannot contain, and that regular expressions are better suited to matching. Router path patterns in web frameworks borrow the brace syntax; they are their own languages, not RFC 6570.
