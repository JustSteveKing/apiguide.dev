---
title: "Structured Field Values for HTTP (RFC 9651)"
description: "A reference for RFC 9651, the common syntax for new HTTP header and trailer fields: Lists, Dictionaries and Items, parameters, the bare item types including Date and Display String, strict parsing, and which fields use it."
currentVersion: "RFC 9651"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9651.html"
---

## What are Structured Fields?

RFC 9651, published in September 2024, defines a small set of data types and exact parsing and serialization algorithms for HTTP field values. It obsoletes RFC 8941 (February 2021), the first version, and adds two types to it.

The problem it solves is that every older header has its own grammar. `Cache-Control`, `Accept`, `Link`, `Set-Cookie` and `Content-Disposition` each need a hand-written parser, each parser handles edge cases differently, and the differences turn into bugs and security holes. A new field defined as a Structured Field instead says "this is a Dictionary whose values are Integers", and every conformant library parses it identically.

It is for **new** fields. You cannot retrofit it onto an existing header whose grammar differs, and a field can only use it for its entire value, never part of it.

---

## 1. The three top-level types

A field definition picks exactly one top-level type:

| Type | Shape | Example |
| :--- | :--- | :--- |
| List | Ordered members, comma-separated | `Example-List: sugar, tea, rum` |
| Dictionary | Ordered `key=value` members, comma-separated | `Example-Dict: en="Applepie", da=:w4ZibGV0w6ZydGU=:` |
| Item | A single bare value | `Example-Integer: 5` |

Members of Lists and Dictionaries are Items or **Inner Lists**, which are space-separated Items in parentheses: `("foo" "bar")`. Dictionary keys and parameter keys are lowercase; uppercase letters fail parsing.

Both Lists and Dictionaries can be split across several field lines and are recombined with a comma, so these are equivalent:

```http
Example-Dict: foo=1, bar=2

Example-Dict: foo=1
Example-Dict: bar=2
```

An empty List or Dictionary is sent by omitting the field.

---

## 2. Parameters

Any Item or Inner List can carry **parameters**: an ordered map of `;key=value` pairs whose values are bare items. Parameters are how fields attach metadata to a member without inventing nested syntax.

```http
Example-List: abc;a=1;b=2; cde_456, (ghi;jk=4 l);q="9";r=w
```

A Boolean true is serialized by omitting the value, so `;a` means `a=?1`. In a Dictionary the same rule applies to member values: `Example-Dict: a=?0, b, c; foo=bar` makes `b` and `c` true.

---

## 3. Bare item types

| Type | Serialization | Example | Notes |
| :--- | :--- | :--- | :--- |
| Integer | Digits, optional `-` | `42` | At most 15 digits |
| Decimal | Digits `.` digits | `4.5` | At most 12 integer and 3 fractional digits |
| String | Double-quoted | `"hello world"` | Printable ASCII only; escape only `"` and `\` |
| Token | Unquoted word | `foo123/456` | Starts with a letter or `*` |
| Byte Sequence | Base64 between colons | `:cHJldGVuZA==:` | |
| Boolean | `?1` or `?0` | `?1` | |
| Date | `@` then Integer seconds | `@1659578233` | Added in RFC 9651 |
| Display String | `%` then double-quoted, percent-encoded UTF-8 | `%"f%c3%bc%c3%bc"` | Added in RFC 9651 |

**Date** is a Unix timestamp in seconds, excluding leap seconds. It gives new fields a compact alternative to the HTTP-date format used by [`Date`](/headers/date) and [`Expires`](/headers/expires), which recipients must still parse in three historical forms. [`Deprecation`](/headers/deprecation), defined in RFC 9745, is one field that uses it.

**Display String** carries Unicode for text shown to people. Strings remain ASCII-only on purpose, and the RFC says not to use a Display String where a String or Token would do, because Unicode brings normalization and homograph problems.

The integer limit is not arbitrary: 15 digits fit exactly in an IEEE 754 double, so JavaScript can hold any valid Integer without loss. If you need a larger number, the RFC suggests a String, a Byte Sequence, or a scaling parameter.

---

## 4. Strict parsing

The only error handling RFC 9651 defines is failure: if any part of a field value does not parse, the whole field is ignored. A field definition can add constraints but cannot loosen this. The RFC is explicit that a parser trying to be helpful with bad input makes interoperability worse, because it pressures everyone else to copy its leniency.

Two practical consequences. First, if several components append members to the same field, one malformed member discards all of them. Second, test your serializer, not just your parser: a stray uppercase key, a single-quoted string or a fourth decimal place will silently remove the field from the recipient's view.

Use a library. Mature implementations exist for most languages, and hand-rolled string concatenation is how the errors above get in.

---

## 5. Fields that use it

The IANA HTTP Field Name registry now has a Structured Type column. Fields you are likely to meet in API work:

| Field | Type | Defined in |
| :--- | :--- | :--- |
| [`Signature-Input`](/headers/signature-input), [`Signature`](/headers/signature), `Accept-Signature` | Dictionary | [RFC 9421](/specifications/http-message-signatures) |
| [`Content-Digest`](/headers/content-digest), [`Repr-Digest`](/headers/repr-digest) | Dictionary | [RFC 9530](/specifications/digest-fields) |
| [`Cache-Status`](/headers/cache-status) | List | RFC 9211 |
| `Proxy-Status` | List | RFC 9209 |
| [`CDN-Cache-Control`](/headers/cdn-cache-control) | Dictionary | RFC 9213 |
| `Priority` | Dictionary | RFC 9218 |
| [`Deprecation`](/headers/deprecation) | Item (Date) | RFC 9745 |
| [`RateLimit`](/headers/ratelimit), [`RateLimit-Policy`](/headers/ratelimit-policy) | List | Internet-Draft `draft-ietf-httpapi-ratelimit-headers` |

The RateLimit fields are still an Internet-Draft and are not yet in the registry. Their exact parameters may change before publication; the choice of a Structured Field List is not expected to.

If you are defining a custom header for your own API, define it as a Structured Field. You get a precise definition in a sentence, parsers in every language, and no argument later about whether a value may contain a comma.
