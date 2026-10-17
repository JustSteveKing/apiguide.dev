---
title: "Money, Decimals and Nulls in JSON"
description: "Representing money as integer minor units or decimal strings, ISO 4217 currency codes and exponents, why floats and large JSON numbers lose data, and the difference between null, absent and empty, including under JSON Merge Patch."
category: "representation"
updatedDate: 2026-10-14
---

## JSON Has Fewer Types Than Your Domain

JSON gives you one number type, one way to say "nothing" and the option of leaving a key out. Your domain has currencies with different numbers of decimal places, quantities that must not round, and at least three distinct meanings of "no value". Every one of those mismatches gets resolved somewhere. If the API does not resolve it explicitly, each consumer resolves it differently.

[Timestamps and formats](/guides/timestamps-and-formats) states the short rules: never use floats for money, and decide what `null` means. This guide is the detail behind them.

---

## 1. Money: Pick Minor Units or Decimal Strings

There are two correct representations. Both pair the amount with an explicit currency, always.

**Integer minor units.** The amount is an integer count of the currency's smallest unit.

```json
{ "amount": 4999, "currency": "USD" }
```

**Decimal string.** The amount is a string holding an exact decimal.

```json
{ "amount": "49.99", "currency": "USD" }
```

Use **minor units** for amounts that are charged, paid, refunded or settled. They are exact, they cannot be misread as having more precision than the currency allows, and integer arithmetic has no rounding to get wrong. Stripe's API takes this approach.

Use **decimal strings** when a value legitimately has more precision than the currency's minor unit: unit prices for metered usage, tax rates, exchange rates, or a per-liter fuel price quoted to three decimal places. Forcing those into minor units either loses precision or invents a second, undocumented scale.

Do not mix the two for the same kind of field. Document which convention each field uses, in its schema, not in a paragraph elsewhere.

### What is forbidden

```json
{ "amount": 49.99 }
```

A JSON number with a fractional part will be decoded as a binary floating-point value by most parsers, and binary floating point cannot represent `0.1`, `0.2` or `49.99` exactly. Summing a few hundred line items decoded that way drifts by fractions of a cent, and reconciliation fails. No amount of rounding in the client makes this safe, because by the time the client sees the value it has already been converted.

---

## 2. ISO 4217 and Minor-Unit Exponents

Currency codes are the three-letter alphabetic codes from ISO 4217, maintained by SIX as the ISO 4217 maintenance agency. Use those and nothing else: not symbols (`$` is a dozen currencies), not names, not your own abbreviations.

"Minor units" does not mean "cents". The exponent varies by currency, and the ISO 4217 list publishes it for each code:

| Code | Currency | Minor-unit exponent | `"amount": 1000` means |
| :--- | :--- | :--- | :--- |
| `USD` | US dollar | 2 | 10.00 |
| `EUR` | Euro | 2 | 10.00 |
| `JPY` | Yen | 0 | 1000 |
| `KRW` | Won | 0 | 1000 |
| `BHD` | Bahraini dinar | 3 | 1.000 |
| `KWD` | Kuwaiti dinar | 3 | 1.000 |
| `CLF` | Unidad de Fomento | 4 | 0.1000 |

An integration that assumes two decimal places everywhere charges a Japanese customer a hundred times too little and a Bahraini customer ten times too much. Read the exponent from the ISO list, or from a library that ships it, and never hard-code `/ 100`.

Your API's exponent for a currency does not have to match ISO's, but it must be documented. Stripe, for example, represents the Icelandic krona (`ISK`, exponent 0 in ISO 4217) as a two-decimal value for backward compatibility, so 5 ISK is sent as `500`. Publish the exponent your API uses for every currency, and consider returning it alongside the amount so clients do not need a table at all.

---

## 3. Large and Precise Numbers

The same problem applies to anything numeric that must survive a round trip exactly. RFC 8259 is explicit that JSON numbers are only interoperable within the precision of IEEE 754 binary64: integers are safe in the range [-(2^53)+1, (2^53)-1], and a value with more significant digits than a double can hold may not come back as it was sent.

| Value | Representation |
| :--- | :--- |
| Counts, small quantities, percentages that tolerate rounding | JSON number |
| Integers that may exceed 2^53 (64-bit counters, IDs) | String. See [identifiers](/guides/identifiers) |
| Exact decimals (rates, measurements with stated precision) | Decimal string |
| Money | Minor-unit integer or decimal string, per section 1 |

In a schema, give the decimal string a `pattern` so validation catches `"1,000.50"` or `"1e3"` before your parser has to:

```yaml
amount:
  type: string
  pattern: '^-?[0-9]+(\.[0-9]+)?$'
  examples: ["49.99"]
```

Always use `.` as the decimal separator and no grouping separators. Locale formatting belongs in the client, as [internationalization](/guides/internationalization) explains.

---

## 4. Null, Absent and Empty Are Three Different Things

For a field like `middle_name` or `tags`, there are at least four states a response can express:

| JSON | Meaning |
| :--- | :--- |
| `"tags": ["vip"]` | Has a value |
| `"tags": []` | Known, and empty |
| `"tags": null` | Known to have no value, or explicitly cleared |
| key absent | Not included in this representation |

Rules that keep these unambiguous:

- **Collections are never null.** An empty list is `[]`. Clients then iterate without a null check, and "null versus empty" stops being a question.
- **Responses include every documented field.** Emit `null` for a field with no value rather than omitting it. Absence is then reserved for one meaning: the field was not requested ([sparse fieldsets](/guides/sparse-fieldsets)) or does not exist in this version.
- **Empty string is not null.** `""` for "no middle name" and `null` for "no middle name" will both appear in your data within a month unless you pick one. Prefer `null` and reject `""` on input where it has no meaning.
- **Make nullability part of the schema.** In OpenAPI 3.1, which aligns with JSON Schema 2020-12, that is `type: ["string", "null"]`; the `nullable` keyword from OpenAPI 3.0 no longer exists. Every field that can be `null` says so, and every field that cannot, cannot.

Changing whether a field can be null, or whether it is ever omitted, is a [breaking change](/guides/breaking-changes) in both directions, because consumers' null handling is written against what they observed.

---

## 5. Nulls in Partial Updates

On a [`PATCH`](/methods/patch), absent and `null` stop being representation details and become instructions: absent means "leave this alone", `null` means "clear this".

[JSON Merge Patch](/specifications/json-merge-patch) (RFC 7396, `application/merge-patch+json`) bakes that in. A member set to `null` in the patch removes the member from the target; an absent member is untouched.

```http
PATCH /customers/cus_NffrFeUfNV2Hib HTTP/1.1
Content-Type: application/merge-patch+json

{ "middle_name": null, "phone": "+44 20 7946 0000" }
```

The consequence is that **Merge Patch cannot set a field to `null`**. It can only remove it. That works cleanly if your model follows section 4 and treats "removed" and `null` as the same state, so that a cleared field is returned as `"middle_name": null` on the next [`GET`](/methods/get). It does not work if `null` and "not set" mean different things in your domain.

Two more Merge Patch consequences to design around:

- **Arrays are replaced whole.** Sending `"tags": ["vip"]` replaces the entire list. There is no way to append. If clients need to add or remove single items, give them [JSON Patch](/specifications/json-patch) or a dedicated sub-resource.
- **A `null` inside a nested object is also a removal.** `{"address": {"line2": null}}` removes `line2` and leaves the rest of `address` in place, which is usually what you want and occasionally a surprise.

If you need to distinguish "set to null" from "remove", Merge Patch is the wrong format; [PATCH strategies](/guides/patch-strategies) compares the alternatives. On the server, whichever format you choose, deserialize the patch into a type that can tell absent from `null` (an optional-of-nullable wrapper, or the raw parsed object). A framework that collapses both into `null` before your code sees them will clear fields the client never mentioned.
