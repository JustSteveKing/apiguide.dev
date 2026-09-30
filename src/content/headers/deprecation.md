---
name: "Deprecation"
description: "Signals that a resource is deprecated, carrying the date deprecation takes or took effect as a Structured Field Date."
category: "response"
standard: true
relatedCodes: []
---

## What is the Deprecation header?

The `Deprecation` response header, defined in [RFC 9745](https://www.rfc-editor.org/rfc/rfc9745.html) (Standards Track, March 2025), tells a client that the resource it is using is deprecated.

It is an Item Structured Header Field, and its value **must** be a Date as defined in Section 3.3.7 of [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html): a Unix timestamp in seconds, prefixed with `@`.

```http
Deprecation: @1688169599
```

That value is 30 June 2023 at 23:59:59 UTC. The date may be in the past, meaning deprecation is already in effect, or in the future, meaning it is announced but has not yet begun.

Two points the specification is explicit about, and both are commonly got wrong:

- **There is no boolean form.** Earlier drafts of this header allowed the value `true`, and allowed an HTTP-date. Neither survived into RFC 9745. A Structured Field Date is the only valid value.
- **Deprecation changes no behavior.** Section 5: "The act of deprecation does not change any behavior of the resource." A deprecated endpoint still works exactly as it did. The header is a signal, never an error.

## API Usage & Best Practices

* **Do not confuse its format with `Sunset`.** They carry dates and they carry them differently: `Deprecation` takes a Structured Field Date, and [`Sunset`](/headers/sunset) takes an HTTP-date. The difference is historical rather than principled, and it catches out almost everyone implementing both for the first time.
* **Order the two dates correctly.** RFC 9745 Section 4: the timestamp in `Sunset` **must not** be earlier than the one in `Deprecation`. A resource cannot stop working before it is deprecated.
* **Pair it with `Sunset`.** On its own, `Deprecation` says a resource is on the way out without saying when it will stop. [`Sunset`](/headers/sunset) supplies the deadline.
* **Link to the migration guide.** Use a `Link` header with `rel="deprecation"`, which RFC 9745 Section 3.1 defines as referring to "documentation (intended for human consumption) about the deprecation of the link's context". That documentation is where the timeline and the replacement belong.
* **Send it on every affected response**, not only on the first. Clients are not obliged to retain it, and the integration you need to reach may only call the endpoint once a month.
* **Emit it well before removal**, and measure who is still receiving it. The header is only useful if it arrives while there is still time to act on it. See [API deprecation and sunsetting](/guides/deprecation-sunsetting).
* **Remember what the consumer can see.** A client reading your documentation sees the warning; a model calling your API as a tool never receives response headers at all, so the date has to appear in the description too. See [how an API becomes tool definitions](/guides/tool-definitions).

## Examples

A resource deprecated as of 30 June 2023, going away at the end of October 2026, with a migration guide:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: @1688169599
Sunset: Sat, 31 Oct 2026 23:59:59 GMT
Link: <https://api.example.com/docs/v2-migration>; rel="deprecation"
```

An announcement of a deprecation that has not yet taken effect, dated 1 July 2027:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: @1814400000
Link: <https://api.example.com/docs/v2-migration>; rel="deprecation"
```
