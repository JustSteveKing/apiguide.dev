---
title: "Timestamps & Data Formats"
description: "Conventions for representing time, money, enums, and nullability in JSON APIs: RFC 3339, always UTC, integer money, and consistent, unambiguous formats."
category: "core"
---

## Introduction to Data Formats

Most integration bugs are not dramatic; they are quiet mismatches over how a value is represented. Is that timestamp local or UTC? Is `amount` dollars or cents? Does a missing field mean "null" or "unchanged"? Getting these conventions right, and applying them uniformly, prevents a long tail of subtle, expensive errors.

This guide covers the representation decisions that come up in almost every API.

---

## 1. Timestamps: RFC 3339 / ISO 8601

Represent every timestamp as an RFC 3339 string, the strict, interoperable profile of ISO 8601. It is unambiguous, sorts lexicographically, and is parseable everywhere.

```json
{
  "created_at": "2026-07-10T09:00:00Z",
  "updated_at": "2026-07-10T09:15:30.500Z"
}
```

Avoid Unix epoch integers in public payloads (they are opaque to humans and ambiguous about units), and never invent your own format like `10/07/2026` which is unreadable across locales.

---

## 2. Always Use UTC

Store and transmit timestamps in UTC, denoted by the `Z` (Zulu) suffix. Leave timezone conversion to the client, which alone knows the user's context.

```json
{ "starts_at": "2026-07-10T14:00:00Z" }
```

If an offset genuinely matters to the domain (a calendar event in a specific locale), include it explicitly (`2026-07-10T14:00:00+02:00`) and consider a separate `timezone` field with an IANA name like `Europe/Berlin`. Never emit a naive timestamp with no offset at all.

---

## 3. Money: Never Use Floats

Floating-point numbers cannot represent many decimal values exactly, so `0.1 + 0.2` is not `0.3`. For currency this is unacceptable. Two safe options:

Represent the amount as an integer in the currency's **minor units** (cents), always paired with an explicit currency:

```json
{ "amount": 4999, "currency": "USD" }
```

Or represent it as a **string** to preserve exact decimal precision:

```json
{ "amount": "49.99", "currency": "USD" }
```

Pick one convention and document which. Always include the ISO 4217 currency code; an amount without a currency is meaningless.

---

## 4. Enums Over Booleans and Magic Values

Represent a fixed set of states as string enums, not integers or booleans. Strings are self-documenting and extensible.

```json
{ "status": "shipped" }
```

Prefer this over `"status": 3` (what is 3?) or a pile of booleans like `is_shipped`, `is_delivered` that can contradict each other. Document the full set of allowed values, and design clients to tolerate unknown ones so you can add states without breaking them.

---

## 5. Null vs Omitted

A missing field and a `null` field can mean different things. Decide the semantics deliberately, especially for [`PATCH`](/methods/patch).

| Representation | Common meaning |
| --- | --- |
| `"middle_name": "Ada"` | Set to this value |
| `"middle_name": null` | Explicitly cleared / no value |
| field omitted | Unknown, or "leave unchanged" on PATCH |

The distinction is what makes partial updates work: omitting a field says "don't touch it," while sending `null` says "clear it." Be explicit about this in your documentation.

---

## 6. Consistent Casing & Naming

Choose one casing convention for JSON field names and apply it across the entire API. `snake_case` and `camelCase` are both common; mixing them is the problem.

```json
{
  "order_id": 42,
  "created_at": "2026-07-10T09:00:00Z",
  "line_items": []
}
```

Beyond casing, keep naming patterns regular: timestamps consistently end in `_at`, booleans read as predicates (`is_active`), and identifiers are consistently `id` or `_id`. Predictability lets developers guess field names correctly, which is the mark of a well-designed [resource representation](/guides/resource-naming).
