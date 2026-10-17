---
title: "Deprecation and Sunset Headers (RFC 9745, RFC 8594)"
description: "A reference for the two HTTP response fields that announce the end of a resource: Deprecation (RFC 9745) for when it stopped being recommended, Sunset (RFC 8594) for when it will stop responding, and the deprecation and sunset link relations."
currentVersion: "RFC 9745 / RFC 8594"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9745.html"
updatedDate: 2026-10-17
---

## What are Deprecation and Sunset?

Retiring an API endpoint usually fails in the same way: the provider announces it in a changelog, an email and a blog post, and the clients that matter never see any of them. The only channel every client is guaranteed to read is the HTTP response itself. These two fields put the retirement schedule there, on every response from the affected resource, where client libraries, gateways and monitoring can pick it up automatically.

They answer two different questions, and they are designed to be used together:

| Field | Question | Specification | Value format |
| :--- | :--- | :--- | :--- |
| [`Deprecation`](/headers/deprecation) | When did (or will) this stop being recommended? | RFC 9745, Proposed Standard, March 2025 | Structured Field Date: `@` plus Unix seconds |
| [`Sunset`](/headers/sunset) | When is this expected to stop responding? | RFC 8594, Informational, May 2019 | HTTP-date |

This page covers them as one mechanism because they only make sense as one. For the process around them (announcement windows, migration guides, usage tracking) see [deprecation and sunsetting](/guides/deprecation-sunsetting) and [versioning](/guides/versioning).

---

## 1. Deprecation (RFC 9745)

`Deprecation` is an Item [Structured Field](/specifications/structured-fields) whose value is a Date: an `@` followed by integer seconds since the Unix epoch.

```http
Deprecation: @1688169599
```

That is 2023-06-30T23:59:59Z. A date in the future means the resource will be deprecated at that moment; a date in the past means it already was.

Deprecation does not change behavior. The resource keeps working exactly as before; the field tells the client it should start migrating. RFC 9745 does add that once a past deprecation date has been reached, clients must not assume the resource's behavior is unchanged, which is a polite way of saying the provider has stopped promising anything.

RFC 9745 defines it as a response field only.

---

## 2. Sunset (RFC 8594)

`Sunset` carries a single HTTP-date, the same format as [`Date`](/headers/date), and SHOULD be in the future.

```http
Sunset: Thu, 31 Dec 2026 23:59:59 GMT
```

It says the resource is expected to become unresponsive at or after that time. A past date should be treated as now: the resource may disappear at any moment. RFC 8594 says nothing about what happens afterward. Clients may get a 3xx, a 4xx or nothing at all; [`410 Gone`](/status-codes/410) is the honest answer for a resource that has been retired on purpose, and it is what you should serve.

The two fields use different date formats only for historical reasons: `Sunset` predates Structured Fields. Do not "fix" `Sunset` by sending an `@` value; parsers expect an HTTP-date.

---

## 3. Using them together

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: @1767225599
Sunset: Thu, 31 Dec 2026 23:59:59 GMT
Link: <https://developer.example.com/deprecations/orders-v1>; rel="deprecation"; type="text/html",
      <https://developer.example.com/sunset-policy>; rel="sunset"; type="text/html"
```

Here the resource was deprecated at the end of 2025 and will be removed at the end of 2026.

The one ordering rule: **the `Sunset` time must not be earlier than the `Deprecation` time**. If a client sees it reversed, RFC 9745 tells it to consult the provider, which in practice means your monitoring has found a bug.

Send `Deprecation` as soon as the decision is made and `Sunset` as soon as you have a date. A client should see the deprecation for the whole migration window, not discover it in the same release that removes the endpoint.

---

## 4. The link relations

Each RFC registers a relation for use with [`Link`](/headers/link):

| Relation | Defined in | Points to |
| :--- | :--- | :--- |
| `deprecation` | RFC 9745 | Information about the deprecation: the policy, a migration guide, the replacement |
| `sunset` | RFC 8594 | Information about the retirement policy, upcoming sunsets or mitigation options |

A date without a link tells a developer something is ending but not what to do about it. Always send the `deprecation` link alongside the field.

---

## 5. Scope

By default, both fields apply only to the resource whose response carries them. A provider may document a wider scope, such as an entire API version, but a client that has not read that documentation will still read the field as applying to the single resource.

Two consequences. First, put the fields on every response from every affected resource, not only on a home document, unless you are sure your clients follow your documented scope. Second, both fields are hints, not guarantees: clients must keep working without them, and providers must not treat sending them as a substitute for announcing the change.

---

## Best Practices

* Log, in client SDKs and gateways, every response carrying `Deprecation`. A warning in the logs months ahead is the entire value of the field.
* Track who still calls deprecated resources and contact them directly before the sunset date. The headers reach code, not people.
* Keep `Sunset` stable once published. Moving it earlier breaks the trust that makes clients act on it; moving it later is fine.
* After the sunset date, return `410 Gone` with a problem details body linking to the replacement, rather than [`404 Not Found`](/status-codes/404).
* Do not use `Warning` or a custom `X-API-Deprecated` header. `Warning` was obsoleted by RFC 9111, and a custom header is invisible to every generic tool that understands these two.
